<template>
  <div class="container">
    <h3>
      <span class="file-name">{{ getFileName(fileName) }}</span>
      <br>
      <span class="file-path">{{ getFilePath(fileName) }}</span>
    </h3>
    <div class="file-viewer">
      <div class="code-container">
        <div v-for="(line, index) in content" :key="index" class="line"
             v-tippy="{
                content: getTooltipContent(index+1)
              }">
          <span class="line-number">{{ index + 1 }}</span>
          <span class="code-line" :class="getLineClass(index)">{{ line }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FileViewer",
  props: {
    content: Array,
    fileName: String,
    removal: Array,
    addition: Array,
    modificationLeft: Object,
    modificationRight: Object,
    microChanges: Array,
    refactorings: Array
  },
  methods: {
    getFilePath(fileName) {
      const parts = fileName.split('/');
      parts.pop(); // Remove the last part which is the file name
      return parts.join('/') + '/';
    },
    getFileName(fileName) {
      const parts = fileName.split('/');
      return parts.pop(); // Return only the file name
    },
    getLineClass(index) {
      const lineClasses = [];

      const refactoringClass = this.getRefactoringClass(index+1);
      if (refactoringClass) {
        lineClasses.push(refactoringClass);
      }

      if (this.isRemoval(index)) {
        lineClasses.push("removal");
      }

      if (this.isAddition(index)) {
        lineClasses.push("addition");
      }

      if (this.isModificationLeft(index)) {
        lineClasses.push("modificationLeft");
      }

      if (this.isModificationRight(index)) {
        lineClasses.push("modificationRight");
      }

      if (this.isMicroChange(index+1)) {
        lineClasses.push("micro-change");
      }

      if (refactoringClass) {
        if (refactoringClass === 'refactoring-high-priority') {
          // Remove all other classes except micro-change
          return lineClasses.includes("micro-change") 
            ? "micro-change" 
            : "refactoring-high-priority";
        }
      }

      return lineClasses[lineClasses.length - 1] || "";
    },
    isRemoval(index) {
      return this.removal ? this.removal[index] : false;
    },
    isAddition(index) {
      return this.addition ? this.addition[index] : false;
    },
    isMicroChange(index) {
      // return  this.microChanges.locations
      //             .map((loc, i) => (loc[0] <= index && index <= loc[1] ? i : -1))
      //             .filter(i => i !== -1).length>0;

      return  this.microChanges.locations?this.microChanges.locations
              .map((loc, i) => (loc[0] <= index && index <= loc[1] ? i : -1))
              .filter(i => i !== -1).length>0: false;
    },
    getRefactoringClass(index) {
      const type = [];
      if (this.refactorings.locations) {
          const matchedIndex = this.refactorings.locations
                  .map((loc, i) => (loc[0] <= index && index <= loc[1] ? i : -1))
                  .filter(i => i !== -1);
          matchedIndex.forEach(p=>type.push(this.refactorings.types[p]));
        }
      let priorityLevel='';

      if (type.length>0) {
        if (type.some(item => item.includes('Package') || item.includes('Class') || item.includes('Subclass') || item.includes('Superclass'))) {
          priorityLevel = 'refactoring-low-priority';
        } 
        if (type.some(item => item.includes('Method') || item.includes('Parameter') || item.includes('Thrown') || item.includes('Interface'))) {
          priorityLevel ='refactoring-medium-priority';
        } 
        if (type.some(item => !item.includes('Package') && !item.includes('Class') && !item.includes('Subclass') && !item.includes('Superclass') && !item.includes('Method') && !item.includes('Parameter') && !item.includes('Thrown') && !item.includes('Interface'))) {
          priorityLevel = 'refactoring-high-priority';
        }
      }

      return priorityLevel;
    },
    isModificationLeft(index) {
      return this.modificationLeft && this.modificationLeft[index];
    },
    isModificationRight(index) {
      return this.modificationRight && this.modificationRight[index];
    },
    getTooltipContent(index) {
      let type = [];

      if (this.microChanges.locations){
        const matchedIndex = this.microChanges.locations
              .map((loc, i) => (loc[0] <= index && index <= loc[1] ? i : -1))
              .filter(i => i !== -1);
        matchedIndex.forEach(p=>type.push(this.microChanges.types[p]));
      }

        if (this.refactorings.locations) {
          const matchedIndex = this.refactorings.locations
                  .map((loc, i) => (loc[0] <= index && index <= loc[1] ? i : -1))
                  .filter(i => i !== -1);
          matchedIndex.forEach(p=>type.push(this.refactorings.types[p]));
        }

      const uniqueSet = new Set(type);
      const result = Array.from(uniqueSet).join(",");
      return result.length ? result : '';
    }
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 50vh;
}
.micro-change {
  background-color: rgba(128, 0, 128, 0.2); /* Purple highlight */
  cursor: pointer; /* Change cursor on hover */
}
.refactoring-high-priority {
  background-color: rgba(13, 86, 97, 0.2); /* Dark blue highlight */
  cursor: pointer; /* Change cursor on hover */
}
.refactoring-medium-priority {
  background-color: rgba(51, 166, 184, 0.2); /* Blue highlight */
  cursor: pointer; /* Change cursor on hover */
}
.refactoring-low-priority {
  background-color: rgba(129, 199, 212, 0.2); /* Light blue highlight */
  cursor: pointer; /* Change cursor on hover */
}
.tooltip {
  z-index: 10000;
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  padding: 5px;
}
.modificationLeft {
  background-color: rgb(247, 225, 59); /* Yellow highlight */
}
.modificationRight {
  background-color: rgb(247, 225, 59); /* Yellow highlight */
}
.removal {
  background-color: rgba(255, 0, 0, 0.2); /* Red highlight */
}
.addition {
  background-color: rgba(0, 255, 0, 0.2); /* Green highlight */
}
.file-viewer {
  flex: 1;
  overflow-y: scroll;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  padding: 10px;
}
h3 {
  margin: 0;
  padding-bottom: 10px;
  color: #333;
}
.code-container {
  display: flex;
  flex-direction: column;
}
.line {
  display: flex;
  align-items: flex-start;
}
.line-number {
  width: 3em;
  padding-right: 10px;
  text-align: right;
  color: #999;
  line-height: 1.5;
  font-size: 14px;
}
.code-line {
  flex: 1;
  line-height: 1.5;
  font-size: 14px;
  white-space: pre-wrap;
}
.file-path {
  font-size: 0.8em;
}
.file-name {
  font-size: 1.2em;
  font-weight: bold;
}
</style>
