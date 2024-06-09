<template>
  <div>
    <div class="filters">
      <label>
        <input type="checkbox" v-model="showModification"> Modification
        <span class="color-indicator" :style="{ backgroundColor: 'yellow' }"></span>
      </label>
      <label>
        <input type="checkbox" v-model="showChanges"> Removal/Addition
        <span class="color-indicator" :style="{ backgroundColor: 'red' }"></span>
        <span class="color-indicator" :style="{ backgroundColor: 'green' }"></span>
      </label>
      <label>
        <input type="checkbox" v-model="showMicroChanges"> Micro Changes
        <span class="color-indicator" :style="{ backgroundColor: 'purple' }"></span>
      </label>
      <label>
        <input type="checkbox" v-model="showRefactorings"> Refactorings
        <span class="color-indicator" :style="{ backgroundColor: 'blue' }"></span>
      </label>
      <button @click="fetchCommitData">Update</button>
    </div>
    <div class="thumbnails-container">
      <div class="thumbnail-item" v-for="(file, index) in files" :key="index">
        <DiffThumbnail
          :key="`${thumbnailUpdateKey}-${index}`"
          :leftHeight="file.preChange.length"
          :rightHeight="file.postChange.length"
          :removal="convertMapToArray(file.removal)"
          :addition="convertMapToArray(file.addition)"
          :modificationLeft="convertMapToArray(file.modificationLeft)"
          :modificationRight="convertMapToArray(file.modificationRight)"
          :microChangeLeft="file.preMicroChanges.flatMap(mc => mc.leftSideLocations.map(loc => [loc.startLine, loc.endLine]))"
          :microChangeRight="file.postMicroChanges.flatMap(mc => mc.rightSideLocations.map(loc => [loc.startLine, loc.endLine]))"
          :refactoringLeft="file.preRefactorings.flatMap(ref => ref.leftSideLocations.map(loc => [loc.startLine, loc.endLine]))"
          :refactoringRight="file.postRefactorings.flatMap(ref => ref.rightSideLocations.map(loc => [loc.startLine, loc.endLine]))"
        />
        <div class="file-path">{{ getFileName(file.name) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import DiffThumbnail from "./DiffThumbnail.vue";

export default {
  name: 'CommitThumbnails',
  components: {
    DiffThumbnail
  },
  data() {
    return {
      files: [],
      showModification: true,
      showChanges: true,
      showMicroChanges: true,
      showRefactorings: true,
      commitSha: this.$route.params.sha1,
      thumbnailUpdateKey: 0
    };
  },
  mounted() {
    this.fetchCommitData();
  },
  methods: {
    async fetchCommitData() {
      const apiUrl = `http://localhost:8081/commits/${this.commitSha}`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        this.files = Object.keys(data.preChangeSourceCode).map(filePath => {
          const preChangeLines = data.preChangeSourceCode[filePath].split(/\r?\n/);
          const postChangeLines = data.postChangeSourceCode[filePath].split(/\r?\n/);
          return {
            name: filePath,
            preChange: preChangeLines.map(line => line + '\n'),
            postChange: postChangeLines.map(line => line + '\n'),
            removal: this.showChanges ? this.getLineRange(data.removal[filePath]) : [],
            addition: this.showChanges ? this.getLineRange(data.addition[filePath]) : [],
            modificationLeft: this.showModification ? this.getLineRange(data.modificationLeft[filePath]) : [],
            modificationRight: this.showModification ? this.getLineRange(data.modificationRight[filePath]) : [],
            preMicroChanges: this.showMicroChanges ? data.microChanges.filter(mc => mc.leftSideLocations.some(loc => loc.path === filePath)) : [],
            postMicroChanges: this.showMicroChanges ? data.microChanges.filter(mc => mc.rightSideLocations.some(loc => loc.path === filePath)) : [],
            preRefactorings: this.showRefactorings ? data.refactorings.filter(ref => ref.leftSideLocations.some(loc => loc.path === filePath)) : [],
            postRefactorings: this.showRefactorings ? data.refactorings.filter(ref => ref.rightSideLocations.some(loc => loc.path === filePath)) : [],
          };
        });
        this.updateThumbnails();
      } catch (error) {
        console.error('Error fetching commit data:', error);
      }
    },
    updateThumbnails() {
      this.thumbnailUpdateKey++;
    },
    getLineRange(range) {
      if (!range) return {};
      const lineRange = {};
      for (let i = 0; i < range.length; i++) {
        const [start, end] = range[i];
        for (let j = start; j <= end; j++) {
          lineRange[j - 1] = true;
        }
      }
      return lineRange;
    },
    convertMapToArray(map) {
      const ranges = [];
      if (!map) {
        return ranges;
      }
      const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
      keys.forEach(key => {
        if (map[key]) {
          ranges.push([key, key]);
        }
      });
      return ranges;
    },
    getFileName(filePath) {
      return filePath.split('/').pop();
    }
  }
};
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}
.filters label {
  margin-bottom: 10px;
}
.thumbnails-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  align-items: end; /* Align items to the bottom */
}
.thumbnail-item {
  box-sizing: border-box;
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.file-path {
  text-align: center;
  margin-top: 5px;
  font-size: 14px;
  color: #333;
  min-height: 20px; /* Ensures that each row of filenames has the same height */
}
</style>
