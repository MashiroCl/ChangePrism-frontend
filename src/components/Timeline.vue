<template>
    <h3>Timeline</h3>
    <div class="timeline">
      <div v-for="(commit, index) in commits" :key="index" class="commit">
        <div class="commit-circle" @click="commitClicked(commit)" :title="commit[0].sha1"></div>
        <div>{{commit[0].sha1.slice(0,7)}}</div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "TimeLine",
    props: {
      commits: Array
    },
    methods: {
      commitClicked(commit) {
        this.$emit('commitClicked', commit);
      }
    }
  };
  </script>
  
  <style scoped>
  .timeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    overflow-x: auto;
    height: 50px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    padding: 0 10px;
    overflow-x: scroll;
  }
  .commit {
    position: relative;
  }
  .commit-circle {
    width: 10px;
    height: 10px;
    background-color: #007bff;
    border-radius: 50%;
    cursor: pointer;
    margin-left: 30px;
  }
  .container div:last-child {
  font-family: monospace; /* Monospaced font for sha1 */
  font-size: 16px; /* Adjust font size as needed */
}
  .commit-circle:hover {
    background-color: #0056b3;
  }
  </style>
  