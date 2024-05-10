<template>
  <div id="app">
    <div class="files-container" v-for="(file, index) in files" :key="index">
      <div class="file-viewer-container">
        <div class="file-viewer-wrap">
          <FileViewer
            :fileName="file.name + ' (Before)'"
            :content="file.preChange"
            :preChangeRange="file.preChangeRange"
            :microChanges="file.preMicroChanges"
            :refactorings="file.preRefactorings"
            class="file-viewer"
          />
        </div>
        <div class="file-viewer-wrap">
          <FileViewer
            :fileName="file.name + ' (After)'"
            :content="file.postChange"
            :postChangeRange="file.postChangeRange"
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

export default {
  name: 'App',
  components: {
    FileViewer
  },
  data() {
    return {
      files: [],
      commitSha: null // Default commit SHA-1 hash
    }
  },
  mounted() {
    this.fetchCommitData();
  },
  methods: {
    async fetchCommitData() {
      const url = window.location.pathname; // Get the current path
      const sha1 = decodeURIComponent(url.split('/').pop()).replace(/['"]+/g, ''); // Get the last segment (SHA-1 hash)
      const apiUrl = `http://localhost:8081/commit/${sha1}`;
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
            preChangeRange: this.getLineRange(data.preChangeRange[filePath]),
            postChangeRange: this.getLineRange(data.postChangeRange[filePath]),
            preMicroChanges: data.microChanges.filter(mc => mc.leftSideLocations.some(loc => loc.path === filePath)),
            postMicroChanges: data.microChanges.filter(mc => mc.rightSideLocations.some(loc => loc.path === filePath)),
            preRefactorings: data.refactorings.filter(ref =>ref.leftSideLocations.some(loc => loc.path === filePath)),
            postRefactorings: data.refactorings.filter(ref =>ref.rightSideLocations.some(loc => loc.path === filePath))
          };
        });
      } catch (error) {
        console.error('Error fetching commit data:', error);
      }
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
    }
  }
}
</script>

<style>
#app {
  font-family: monospace, Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  margin: 0;
}

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
