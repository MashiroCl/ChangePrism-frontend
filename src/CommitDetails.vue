<template>
  <div>
    <div class="filters">
            <label><input type="checkbox" v-model="showTextualChanges"> Textual Diff</label>
            <label><input type="checkbox" v-model="showChanges"> In-method Diff</label>
            <label><input type="checkbox" v-model="showMicroChanges"> Micro Changes</label>
            <label><input type="checkbox" v-model="showRefactorings"> Refactorings</label>
            <button @click="fetchCommitData">Update</button>
        </div>
    <div class="files-container" v-for="(file, index) in files" :key="index">
      <!-- Use a flex container to keep elements horizontally aligned -->
      <div class="file-viewer-container" style="display: flex; align-items: flex-start; justify-content: center;">
        <!-- FileViewer Before -->
        <div class="file-viewer-wrap" style="flex-grow: 1; padding: 10px;">
          <FileViewer
            :fileName="file.name + ' (Before)'"
            :content="file.preChange"
            :preChangeRange="file.preChangeRange"
            :microChanges="file.preMicroChanges"
            :refactorings="file.preRefactorings"
            :preTextualDiff = "file.preTextualChangeRange"
            :postTextualDiff = "file.postTextualChangeRange"
            class="file-viewer"
          />
        </div>
        <!-- DiffThumbnail -->
        <div class="thumbnail-container" style="flex-grow: 0; padding: 10px; max-width: 100px;">
          <DiffThumbnail
            :key="`${thumbnailUpdateKey}`"
            :totalLength="Math.max(file.preChange.length, file.postChange.length)"
            :textualLeft="this.convertMapToArray(file.preTextualChangeRange)"
            :textualRight="this.convertMapToArray(file.postTextualChangeRange)"
            :left="this.convertMapToArray(file.preChangeRange)"
            :right="this.convertMapToArray(file.postChangeRange)"
            :microChangeLeft="file.preMicroChanges.map(mc => mc.leftSideLocations.map(loc => [loc.startLine, loc.endLine]))"
            :microChangeRight="file.postMicroChanges.map(mc => mc.rightSideLocations.map(loc => [loc.startLine, loc.endLine]))"
            :refactoringLeft="file.preRefactorings.map(ref => ref.leftSideLocations.map(loc => [loc.startLine, loc.endLine]))"
            :refactoringRight="file.postRefactorings.map(ref => ref.rightSideLocations.map(loc => [loc.startLine, loc.endLine]))"
          />
        </div>
        <!-- FileViewer After -->
        <div class="file-viewer-wrap" style="flex-grow: 1; padding: 10px;">
          <FileViewer
            :fileName="file.name + ' (After)'"
            :content="file.postChange"
            :postChangeRange="file.postChangeRange"
            :microChanges="file.postMicroChanges"
            :refactorings="file.postRefactorings"
            :preTextualDiff = "file.preTextualChangeRange"
            :postTextualDiff = "file.postTextualChangeRange"
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
      showTextualChanges: true,
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
          return {
            name: filePath,
            preChange: preChangeLines.map(line => line + '\n'),
            postChange: postChangeLines.map(line => line + '\n'),
            preTextualChangeRange: this.showTextualChanges?this.getLineRange(data.preTextualChangeRange[filePath]):[],
            postTextualChangeRange: this.showTextualChanges?this.getLineRange(data.postTextualChangeRange[filePath]):[],
            preChangeRange: this.showChanges?this.getLineRange(data.preChangeRange[filePath]):[],
            postChangeRange: this.showChanges?this.getLineRange(data.postChangeRange[filePath]):[],
            preMicroChanges: this.showMicroChanges?data.microChanges.filter(mc => mc.leftSideLocations.some(loc => loc.path === filePath)):[],
            postMicroChanges: this.showMicroChanges?data.microChanges.filter(mc => mc.rightSideLocations.some(loc => loc.path === filePath)):[],
            preRefactorings: this.showRefactorings?data.refactorings.filter(ref =>ref.leftSideLocations.some(loc => loc.path === filePath)):[],
            postRefactorings: this.showRefactorings?data.refactorings.filter(ref =>ref.rightSideLocations.some(loc => loc.path === filePath)):[],
            // preTextualDiff: this.showTextualChanges?this.getLineRange(data.preTextualChangeRange[filePath]):[],
            // postTextualDiff: this.showTextualChanges?this.getLineRange(data.postTextualChangeRange[filePath]):[]
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
</style>
