<template>
  <div>
    <div class="filters">
        <div class="filters">
            <label>
                <input type="checkbox" v-model="Modification"> Modification
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
      </div>
    <div class="files-container" v-for="(file, index) in files" :key="index">
      <!-- Use a flex container to keep elements horizontally aligned -->
      <div class="file-viewer-container" style="display: flex; align-items: flex-start; justify-content: center;">
        <!-- FileViewer Before -->
        <div class="file-viewer-wrap" style="flex-grow: 1; padding: 10px;">
          <FileViewer
            :fileName="file.name"
            :content="file.preChange"
            :removal="file.removal"
            :modificationLeft = "file.modificationLeft"
            :modificationRight = "file.modificationRight"
            :microChanges="file.preMicroChanges"
            :refactorings="file.preRefactorings"
            class="file-viewer"
          />
        </div>
        <!-- DiffThumbnail -->
        <div class="thumbnail-container" style="flex-grow: 1; padding: 20px; max-width: 100px;">
          <DiffThumbnail
            :key="`${thumbnailUpdateKey}`"
            :leftHeight="file.preChange.length"
            :rightHeight="file.postChange.length"
            :removal="this.convertMapToArray(file.removal)"
            :addition="this.convertMapToArray(file.addition)"
            :modificationLeft="this.convertMapToArray(file.modificationLeft)"
            :modificationRight="this.convertMapToArray(file.modificationRight)"
            :microChangeLeft="file.preMicroChanges.flatMap(mc => mc.leftSideLocations.map(loc => [loc.startLine, loc.endLine]))"
            :microChangeRight="file.postMicroChanges.flatMap(mc => mc.rightSideLocations.map(loc => [loc.startLine, loc.endLine]))"
            :refactoringLeft="file.preRefactorings.flatMap(ref => ref.leftSideLocations.map(loc => [loc.startLine, loc.endLine]))"
            :refactoringRight="file.postRefactorings.flatMap(ref => ref.rightSideLocations.map(loc => [loc.startLine, loc.endLine]))"
            :refactoringTypesLeft="file.refactoringTypesLeft"
            :refactoringTypesRight="file.refactoringTypesRight"
          />
        </div>
        <!-- FileViewer After -->
        <div class="file-viewer-wrap" style="flex-grow: 1; padding: 10px;">
          <FileViewer
            :fileName="file.name "
            :content="file.postChange"
            :addition="file.addition"
            :modificationLeft = "file.modificationLeft"
            :modificationRight = "file.modificationRight"
            :microChanges="file.postMicroChanges"
            :refactorings="file.postRefactorings"
            class="file-viewer"
          />
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import FileViewer from "./components/FileViewer.vue";
import DiffThumbnail from "./components/DiffThumbnail.vue";

export default {
  name: 'CommitDetails',
  components: {
    FileViewer,
    DiffThumbnail
  },
  data() {
    return {
      files: [],
      Modification: true,
      showChanges: true,
      showMicroChanges: true,
      showRefactorings: true,
      commitSha: null, // Default commit SHA-1 hash
      thumbnailUpdateKey: 0
    }
  },
  mounted() {
    this.fetchCommitData();
  },
  methods: {
    async fetchCommitData() {
      const url = window.location.pathname; // Get the current path
      const sha1 = decodeURIComponent(url.split('/').pop()).replace(/['"]+/g, ''); // Get the last segment (SHA-1 hash)
      const apiUrl = `http://localhost:8081/commits/${sha1}`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        this.files = Object.keys(data.preChangeSourceCode).map(filePath => {
          const preChangeLines = data.preChangeSourceCode[filePath].split(/\r?\n/);
          const postChangeLines = data.postChangeSourceCode[filePath].split(/\r?\n/);
          const refactoringTypes = data.refactorings.map(r => r.type);
          return {
            name: filePath,
            preChange: preChangeLines.map(line => line + '\n'),
            postChange: postChangeLines.map(line => line + '\n'),
            removal: this.showChanges?this.getLineRange(data.removal[filePath]):[],
            addition: this.showChanges?this.getLineRange(data.addition[filePath]):[],
            modificationLeft: this.Modification?this.getLineRange(data.modificationLeft[filePath]):[],
            modificationRight: this.Modification?this.getLineRange(data.modificationRight[filePath]):[],
            preMicroChanges: this.showMicroChanges?data.microChanges.filter(mc => mc.leftSideLocations.some(loc => loc.path === filePath)):[],
            postMicroChanges: this.showMicroChanges?data.microChanges.filter(mc => mc.rightSideLocations.some(loc => loc.path === filePath)):[],
            preRefactorings: this.showRefactorings?data.refactorings.filter(ref =>ref.leftSideLocations.some(loc => loc.path === filePath)):[],
            postRefactorings: this.showRefactorings?data.refactorings.filter(ref =>ref.rightSideLocations.some(loc => loc.path === filePath)):[],
            refactoringTypesLeft: this.showRefactorings ? refactoringTypes : [],
            refactoringTypesRight: this.showRefactorings ? refactoringTypes : []
          };
        });
        this.updateThumbnails();
      } catch (error) {
        console.error('Error fetching commit data:', error);
      }
    },
    updateThumbnails(){
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
    convertMapToArray(map){
      const ranges = [];
      if(!map){
        return ranges;
      }
      const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
      keys.forEach(key => {
      if (map[key]) {
        ranges.push([key, key]);
      }
  });
  return ranges;
    }
  }
}
</script>

<style>
.files-container {
  margin-bottom: 20px; /* Space between each file pair */
}

.file-viewer-container {
  display: flex;
  gap: 10px; /* Space between pre-change and post-change viewers */
}

.file-viewer-wrap {
  flex: 1;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.color-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-left: 5px;
        vertical-align: middle;
}

.thumbnail-container {
    flex-basis: 300px; /* Adjust based on the size of the thumbnail component */
    padding-left: 20px;
}
</style>
