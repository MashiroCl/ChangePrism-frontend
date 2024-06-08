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
        if (this.isMicroChange(index+1)) {
          return "micro-change";
        }
        if(this.isRefactoring(index+1)){
          return "refactoring";
        }
        if (this.isRemoval(index-1)) {
          return "removal";
        }
        if (this.isAddition(index-1)) {
          return "addition";
        }
        if (this.isModificationLeft(index-1)){
          return "modificationLeft";
        }
        if (this.isModificationRight(index-1)){
          return "modificationRight";
        }
        return "";
      },
      isRemoval(index) {
        return this.removal?this.removal[index]:false;
      },
      isAddition(index) {
        return this.addition?this.addition[index]:false;
      },
      isMicroChange(index) {
        return this.microChanges.some(change => {
          const locations = this.fileName.includes('(Before)') ? change.leftSideLocations : change.rightSideLocations;
          return locations.some(loc => loc.startLine <= index && index <= loc.endLine);
        });
      },
      isRefactoring(index){
        return this.refactorings? this.refactorings.some(change => {
          const locations = this.fileName.includes('(Before)') ? change.leftSideLocations : change.rightSideLocations;
          return locations.some(loc => loc.startLine <= index && index <= loc.endLine);
        }): false;
      },
      isModificationLeft(index) {
        return this.modificationLeft && this.modificationLeft[index];
      },
      isModificationRight(index) {
        return this.modificationRight && this.modificationRight[index];
      },
      getTooltipContent(index) {
        const microchange = this.microChanges.filter(change => {
          const locations = this.fileName.includes('(Before)') ? change.leftSideLocations : change.rightSideLocations;
          return locations.some(loc => loc.startLine <= index && index <= loc.endLine);
        });
        const refactorings = this.refactorings.filter(change => {
          const locations = this.fileName.includes('(Before)') ? change.leftSideLocations : change.rightSideLocations;
          return locations.some(loc => loc.startLine <= index && index <= loc.endLine);
        });
        if(microchange.length){
          console.log("microchange ", microchange);
        }
        if(refactorings.length){
          console.log("refactorings ", refactorings);
        }
        let type = [];
        for(let i=0;i<microchange.length;i++){
          type.push(microchange[i].type);
        }
        for(let i=0;i<refactorings.length;i++){
          type.push(refactorings[i].type);
        }

        const uniqueSet = new Set(type);
        const result = Array.from(uniqueSet).join(",");
        return result.length? result : '';
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
.refactoring{
  background-color: rgba(61, 139, 202, 0.2); /* Blue highlight */
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

