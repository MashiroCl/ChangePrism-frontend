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
                <span class="color-indicator" :style="{ backgroundColor: '#B28FCE' }"></span>
            </label>
            <label>
                <input type="checkbox" v-model="showRefactorings"> Refactorings
                <span class="color-indicator" :style="{ backgroundColor: '#81C7D4' }"></span>
                <span class="color-indicator" :style="{ backgroundColor: '#33A6B8' }"></span>
                <span class="color-indicator" :style="{ backgroundColor: '#0D5661' }"></span>
            </label>
      <button @click="fetchCommitData">Update</button>
    </div>
    <div class="thumbnails-container">
      <div class="thumbnail-item" v-for="(file, index) in files" :key="index">
        <DiffThumbnail
            :key="`${thumbnailUpdateKey}`"
            :leftHeight="file.preChange.length"
            :rightHeight="file.postChange.length"
            :addition="file.additionChangeRange"
            :removal="file.removalChangeRange"
            :modificationLeft="file.modificationLeftChangeRange"
            :modificationRight="file.modificationRightChangeRange"
            :microChangeLeft="file.preMicroChangeRange"
            :microChangeRight="file.postMicroChangeRange"
            :refactoringLeft="file.preRefactoringRange"
            :refactoringRight="file.postRefactoringRange"
            :refactoringTypesLeft="file.refactoringTypesLeft"
            :refactoringTypesRight="file.refactoringTypesRight"
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
        const microChanges = this.extractFromSpecialChange(data.microChanges);
        const refactorings = this.extractFromSpecialChange(data.refactorings);
        this.files = Object.keys(data.preChangeSourceCode).map(filePath => {
          const preChangeLines = data.preChangeSourceCode[filePath].split(/\r?\n/);
          const postChangeLines = data.postChangeSourceCode[filePath].split(/\r?\n/);
          const additionChangeRange = data.addition[filePath] || [];
          const removalChangeRange = data.removal[filePath] || [];
          const modificationLeftChangeRange = data.modificationLeft[filePath] || [];
          const modificationRightChangeRange = data.modificationRight[filePath] || [];

          const preMicroChangeRange = microChanges.left[filePath];
          const postMicroChangeRange = microChanges.right[filePath];
          const preRefactoringRange = refactorings.left[filePath];
          const postRefactoringRange = refactorings.right[filePath];
          const refactoringTypesLeft = refactorings.leftTypes[filePath];
          const refactoringTypesRight = refactorings.rightTypes[filePath];
          return {
            name: filePath,
            preChange: preChangeLines.map(line => line + '\n'),
            postChange: postChangeLines.map(line => line + '\n'),
            preMicroChanges: this.showMicroChanges?data.microChanges.filter(mc => mc.leftSideLocations.some(loc => loc.path === filePath)):[],
            postMicroChanges: this.showMicroChanges?data.microChanges.filter(mc => mc.rightSideLocations.some(loc => loc.path === filePath)):[],
            preRefactorings: this.showRefactorings?data.refactorings.filter(ref =>ref.leftSideLocations.some(loc => loc.path === filePath)):[],
            postRefactorings: this.showRefactorings?data.refactorings.filter(ref =>ref.rightSideLocations.some(loc => loc.path === filePath)):[],
            additionChangeRange: this.showChanges ? additionChangeRange : [],
            removalChangeRange: this.showChanges ? removalChangeRange : [],
            modificationLeftChangeRange: this.showModification ? modificationLeftChangeRange : [],
            modificationRightChangeRange: this.showModification ? modificationRightChangeRange : [],
            preMicroChangeRange: this.showMicroChanges ? preMicroChangeRange : [],
            postMicroChangeRange: this.showMicroChanges ? postMicroChangeRange : [],
            preRefactoringRange: this.showRefactorings ? preRefactoringRange : [],
            postRefactoringRange: this.showRefactorings ? postRefactoringRange : [],
            refactoringTypesLeft: this.showRefactorings ? refactoringTypesLeft : [],
            refactoringTypesRight: this.showRefactorings ? refactoringTypesRight : []
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
          lineRange[j] = true;
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
    },
    extractFromSpecialChange(specialChanges) {
            const grouped = {
                left: {},
                right: {},
                leftTypes: {},
                rightTypes: {}
            };
            for (const specialChange of specialChanges) {
                for (const entry of specialChange.leftSideLocations) {
                    if (!grouped.left[entry.path]) {
                        grouped.left[entry.path] = []; // Initialize if not already
                    }
                    grouped.left[entry.path].push([entry.startLine, entry.endLine]);
                    if (!grouped.leftTypes[entry.path]) {
                        grouped.leftTypes[entry.path] = [];
                    }
                    grouped.leftTypes[entry.path].push(specialChange.type);
                }

                for (const entry of specialChange.rightSideLocations) {
                    if (!grouped.right[entry.path]) {
                        grouped.right[entry.path] = []; // Initialize if not already
                    }
                    grouped.right[entry.path].push([entry.startLine, entry.endLine]);
                    if (!grouped.rightTypes[entry.path]) {
                        grouped.rightTypes[entry.path] = [];
                    }
                    grouped.rightTypes[entry.path].push(specialChange.type);
                }
            }
            return grouped;
        }
  }
};
</script>

<style scoped>
.color-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-left: 5px;
    vertical-align: middle;
}

.filters {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #ffffff;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.filters label {
    display: flex;
    align-items: center;
    margin-right: 20px;
    font-family: Arial, sans-serif;
}

.filters input[type="checkbox"] {
    margin-right: 5px;
}

.filters .color-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-left: 5px;
    vertical-align: middle;
    border: 1px solid #ddd;
    border-radius: 50%;
}

button {
    padding: 5px 10px;
    background-color: #3498db;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: Arial, sans-serif;
}

button:hover {
    background-color: #2980b9;
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
