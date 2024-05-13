<template>
    <div>
      <div :style="{ width: totalLength + 'px', height: '50px', display: 'flex' }">
        <div v-for="(block, index) in blocks" :key="index">
          <!-- Each block now has a top and bottom div -->
          <div :style="{ width: block.width + 'px', height: '25px', backgroundColor: block.topColor }"></div>
          <div :style="{ width: block.width + 'px', height: '25px', backgroundColor: block.bottomColor }"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props:{
        totalLength: Number,
        left: Array,
        right: Array,
        microChangeLeft: Array,
        microChangeRight: Array,
        refactoringLeft: Array,
        refactoringRight: Array
    },  
    data() {
    return {
      blocks: []
    };
  },
    methods: {
      mergeIntervals() {
        let topColors = new Array(this.totalLength + 1).fill('grey');
        let bottomColors = new Array(this.totalLength + 1).fill('grey');

        // Apply colors based on left and right arrays
        this.left.forEach(interval => {
          for (let i = interval[0]; i <= interval[1]; i++) {
            topColors[i] = 'red';
            bottomColors[i] = 'red'; // initially mark both layers as red
          }
        });
  
        this.right.forEach(interval => {
          for (let i = interval[0]; i <= interval[1]; i++) {
            if (topColors[i] === 'red') { // only change bottom layer if top is already red
              bottomColors[i] = 'green'; 
            } else {
              topColors[i] = 'green';
              bottomColors[i] = 'green'; // mark both layers as green if not previously red
            }
          }
        });

        if(this.refactoringLeft){
            this.refactoringLeft.forEach(interval => {
                console.log("refactoring here");
            for (let i = interval[0]; i <= interval[1]; i++) {
                topColors[i] = 'blue';
                bottomColors[i] = 'blue';
            }
          });
        }
        if(this.refactoringRight){
            this.refactoringRight.forEach(interval => {
                console.log("refactoring here");
            for (let i = interval[0]; i <= interval[1]; i++) {
                topColors[i] = 'blue';
                bottomColors[i] = 'blue';
            }
          });
        }


        if(this.microChangeLeft){
            this.microChangeLeft.forEach(interval => {
                console.log("microchange here");
            for (let i = interval[0]; i <= interval[1]; i++) {
                topColors[i] = 'purple';
                bottomColors[i] = 'purple';
            }
          });
        }

        if(this.microChangeRight){
            this.microChangeRight.forEach(interval => {
                console.log("microchange here");
            for (let i = interval[0]; i <= interval[1]; i++) {
                topColors[i] = 'purple';
                bottomColors[i] = 'purple';
            }
          });
        }
  
        // Consolidate contiguous blocks of the same color
        let currentTopColor = topColors[1];
        let currentBottomColor = bottomColors[1];
        let start = 1;
        for (let i = 1; i <= this.totalLength; i++) {
          if (topColors[i] !== currentTopColor || bottomColors[i] !== currentBottomColor) {
            this.blocks.push({
              width: i - start,
              topColor: currentTopColor,
              bottomColor: currentBottomColor
            });
            currentTopColor = topColors[i];
            currentBottomColor = bottomColors[i];
            start = i;
          }
        }
        // Push the last block
        if (start <= this.totalLength) {
          this.blocks.push({
            width: this.totalLength + 1 - start,
            topColor: currentTopColor,
            bottomColor: currentBottomColor
          });
        }
      }
    },
    mounted() {
      this.mergeIntervals();
    }
  }
  </script>
  
  <style scoped>
.rectangle-top{

}
.rectangle-bottom{
    
}
  </style>
  