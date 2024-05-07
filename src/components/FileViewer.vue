<!-- <template>
    <div class="file-viewer">
      <h3>{{ fileName }}</h3>
      <div class="code-container">
        <div class="line-numbers">
          <span v-for="(line, index) in content" :key="index" class="line-number">{{ index + 1 }}</span>
        </div>
          <code>
            <span v-for="(line, index) in content" :key="index" class="code-line">{{ line }}</span>
          </code>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "FileViewer",
    props: {
      content: Array,
      fileName: String
    }
  };
  </script>
  
  <style scoped>
  .file-viewer {
    height: 300px;
    overflow-y: scroll;
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    padding: 10px;
    white-space: pre-wrap;
    margin-bottom: 20px;
  }
  
  h3 {
    margin: 0;
    padding-bottom: 10px;
    color: #333;
  }
  
  .code-container {
    display: flex;
  }
  
  .line-numbers {
    display: flex;
    flex-direction: column;
    padding-right: 10px;
    text-align: right;
    color: #999;
    width: 3em;
  }
  
  .line-number {
    padding: 0 5px;
    line-height: 1.5;
    font-size: 14px; /* Adjust font size to match code lines */
  }
  
  pre {
    margin: 0;
  }
  
  .code-line {
    display: block;
    margin-left: 1em;
    font-size: 14px; /* Adjust font size to match line numbers */
  }
  </style>
   -->


<template>
    <div class="file-viewer">
      <h3>{{ fileName }}</h3>
      <div class="code-container">
        <div class="line-numbers">
          <span v-for="(line, index) in content" :key="index" class="line-number">{{ index + 1 }}</span>
        </div>
        <code>
          <span v-for="(line, index) in content" :key="index" :class="getLineClass(index)">{{ line }}</span>
        </code>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "FileViewer",
    props: {
      content: Array,
      fileName: String,
      preChangeRange: Object,
      postChangeRange: Object
    },
    methods: {
      getLineClass(index) {
        if (this.preChangeRange && this.preChangeRange[index]) {
          return "pre-change";
        } else if (this.postChangeRange && this.postChangeRange[index]) {
          return "post-change";
        } else {
          return "";
        }
      }
    }
  };
  </script>
  
  <style scoped>
  /* Add styles for pre-change and post-change */
  .pre-change {
    background-color: rgba(255, 0, 0, 0.2); /* Red highlight */
  }
  .post-change {
    background-color: rgba(0, 255, 0, 0.2); /* Green highlight */
  }
  
  /* Keep existing styles */
  .file-viewer {
    height: 300px;
    overflow-y: scroll;
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    padding: 10px;
    white-space: pre-wrap;
    margin-bottom: 20px;
  }
  
  h3 {
    margin: 0;
    padding-bottom: 10px;
    color: #333;
  }
  
  .code-container {
    display: flex;
  }
  
  .line-numbers {
    display: flex;
    flex-direction: column;
    padding-right: 10px;
    text-align: right;
    color: #999;
    width: 3em;
  }
  
  .line-number {
    padding: 0 5px;
    line-height: 1.5;
    font-size: 14px; /* Adjust font size to match code lines */
  }
  
  pre {
    margin: 0;
  }
  
  .code-line {
    display: block;
    margin-left: 1em;
    font-size: 14px; /* Adjust font size to match line numbers */
  }
  </style>