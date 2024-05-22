<template>
    <div class="container">
        <div class="filters">
            <label><input type="checkbox" v-model="showTextualChanges"> Textual Diff</label>
            <label><input type="checkbox" v-model="showChanges"> In-method Diff</label>
            <label><input type="checkbox" v-model="showMicroChanges"> Micro Changes</label>
            <label><input type="checkbox" v-model="showRefactorings"> Refactorings</label>
            <button @click="updateThumbnails">Update Thumbnails</button>
        </div>
        <div class="commits">
            <!-- Commit Group section -->
            <section v-for="(commitGroup, index) in filteredCommitDetails" :key="'group-' + index" class="commit-group">
                <!-- Commit SHA1 and link -->
                <a :href="`/commits/${commitGroup[0].sha1}`" class="commit-link">
                    <h3 class="commit-title">Commit SHA1: {{ commitGroup[0].sha1 }}</h3>
                </a>
                <!-- File changes list with DiffThumbnail on the right -->
                <div class="files-container">
                    <ul>
                        <li v-for="(fileChange, idx) in commitGroup" :key="'file-' + idx" class="file-change">
                            <div class="file-details">
                                <div class="file-path">File: {{ fileChange.filePath }}</div>
                            </div>
                            <div class="thumbnail-container">
                                <DiffThumbnail
                                    :key="`file-${idx}-${uniqueKey}`"
                                    :leftHeight="fileChange.preChangeSize"
                                    :rightHeight="fileChange.postChangeSize"
                                    :textualLeft="fileChange.preTextualChangeRange"
                                    :textualRight="fileChange.postTextualChangeRange"
                                    :left="fileChange.preChangeRange"
                                    :right="fileChange.postChangeRange"
                                    :microChangeLeft="fileChange.preMicroChangeRange"
                                    :microChangeRight="fileChange.postMicroChangeRange"
                                    :refactoringLeft="fileChange.preRefactoringRange"
                                    :refactoringRight="fileChange.postRefactoringRange"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    </div>
</template>


<script>
import DiffThumbnail from "./components/DiffThumbnail";
export default{
    name: 'CommitsView',
    components: {
        DiffThumbnail
    },   
    data() {
    return {
      commitDetails: [],
      showTextualChanges: true,
      showChanges: true,
      showMicroChanges: true,
      showRefactorings: true,
      uniqueKey: 0,
      filteredCommitDetails: []
    }
    },
    mounted(){
        this.fetchCommitData();
    },
    methods:{    
    async fetchCommitData() {
      const apiUrl = `http://localhost:8081/commits/`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const commitDetails = data.flatMap(commit=>{
            // collect the microchanges & refactorings
            const microChanges = this.extractRangeFromSpecialChange(commit.microChanges);
            const refactorings = this.extractRangeFromSpecialChange(commit.refactorings);
            return Object.keys(commit.preChangeSourceCode).map(filePath => {
                const preTextualChangeRange = commit.preTextualChangeRange[filePath] || [];
                const postTextualChangeRange = commit.postTextualChangeRange[filePath] || [];
                const preChangeRange = commit.preChangeRange[filePath] || [];
                const postChangeRange = commit.postChangeRange[filePath] || [];
                const preMicroChangeRange = microChanges.left[filePath];
                const postMicroChangeRange = microChanges.right[filePath];
                const preRefactoringRange = refactorings.left[filePath];
                const postRefactoringRange = refactorings.right[filePath];
                return {
                    sha1: commit.sha1,
                    filePath:filePath,
                    preTextualChangeRange: this.showTextualChanges? preTextualChangeRange: [],
                    postTextualChangeRange: this.showTextualChanges? postTextualChangeRange: [],
                    preChangeRange: this.showChanges? preChangeRange: [],
                    postChangeRange: this.showChanges? postChangeRange: [],
                    preChangeSize:  commit.preChangeSourceCode[filePath].split(/\r?\n/).length,
                    postChangeSize: commit.postChangeSourceCode[filePath].split(/\r?\n/).length,
                    preMicroChangeRange: this.showMicroChanges? preMicroChangeRange: [],
                    postMicroChangeRange: this.showMicroChanges? postMicroChangeRange: [],
                    preRefactoringRange: this.showRefactorings? preRefactoringRange: [],
                    postRefactoringRange: this.showRefactorings? postRefactoringRange: []
                }
            });
        });
        this.commitDetails = this.groupBySha1(commitDetails);
        this.updateThumbnails();
      } catch (error) {
        console.error('Error fetching commit data:', error);
      }
    },
    groupBySha1(commitArray) {
            return commitArray.reduce((acc, item) => {
                const group = acc.find(g => g[0].sha1 === item.sha1);
                if (group) {
                    group.push(item);
                } else {
                    acc.push([item]);
                }
                return acc;
            }, []);
        },
    extractRangeFromSpecialChange(specialChanges){
            const grouped = {
            left: {},
            right: {}
        };
        for(const specialChange of specialChanges){
            for (const entry of specialChange.leftSideLocations) {
                if (!grouped.left[entry.path]) {
                    grouped.left[entry.path] = []; // Initialize if not already
                }
                grouped.left[entry.path].push([entry.startLine, entry.endLine]);
            }

            for (const entry of specialChange.rightSideLocations) {
                if (!grouped.right[entry.path]) {
                    grouped.right[entry.path] = []; // Initialize if not already
                }
                grouped.right[entry.path].push([entry.startLine, entry.endLine]);
            }
            }

            for (const path in grouped.left) {
                this.sortRanges(grouped.left[path]);
            }
            for (const path in grouped.right) {
                this.sortRanges(grouped.right[path]);
            }

            // for (const entry of grouped.left){
                // console.log("grouped.left[entry]",grouped.left[entry]);
            // }

            return grouped;
    },
    sortRanges(ranges) {
    ranges.sort((a, b) => a[0] - b[0]);
    const uniqueSet = new Set(ranges.map(item => JSON.stringify(item)));
    const uniqueArrays = Array.from(uniqueSet).map(item => JSON.parse(item));
    ranges.length = 0; // Clear the original array
    uniqueArrays.forEach(item => ranges.push(item)); // Push unique and sorted items back to the original array
    },
    groupLineRange(range) {
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
    getsha1(data){
        data.forEach(item=>{
        if(item.sha1){
            this.sha1s.push(item.sha1);
        }
    });
    },
    updateThumbnails() {
            this.filteredCommitDetails = this.commitDetails.map(commitGroup => 
                commitGroup.map(fileChange => ({
                    ...fileChange,
                    preTextualChangeRange: this.showTextualChanges ? fileChange.preTextualChangeRange : [],
                    postTextualChangeRange: this.showTextualChanges ? fileChange.postTextualChangeRange : [],
                    preChangeRange: this.showChanges ? fileChange.preChangeRange : [],
                    postChangeRange: this.showChanges ? fileChange.postChangeRange : [],
                    preMicroChangeRange: this.showMicroChanges ? fileChange.preMicroChangeRange : [],
                    postMicroChangeRange: this.showMicroChangeRange ? fileChange.postMicroChangeRange : [],
                    preRefactoringRange: this.showRefactorings ? fileChange.preRefactoringRange : [],
                    postRefactoringRange: this.showRefactorings ? fileChange.postRefactoringRange : []
                }))
            );
            this.uniqueKey++; // Change the unique key to force re-rendering
        }
    }
}
</script>


<style scoped>
.container {
    max-width: 1200px;
    margin: auto;
    padding: 20px;
    font-family: monospace, Arial, sans-serif;
}

.commits {
    background: #f9f9f9;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    border-radius: 8px;
}

.commit-group {
    border: 1px solid #ccc;
    margin-bottom: 20px;
    padding: 15px;
    border-radius: 8px;
}

.commit-link {
    text-decoration: none;
    color: #3498db;
}

.commit-link:hover {
    text-decoration: underline;
}

.commit-title {
    margin-bottom: 15px;
}

.files-container {
    display: flex;
    flex-direction: column;
}

.file-change {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 10px;
    padding: 10px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.file-details {
    flex: 1;
}

.thumbnail-container {
    flex-basis: 300px; /* Adjust based on the size of the thumbnail component */
    padding-left: 20px;
}

.file-path {
    font-weight: bold;
}

@media (max-width: 768px) {
    .file-change {
        flex-direction: column;
    }
    .thumbnail-container {
        padding-left: 0;
        padding-top: 10px;
    }
}
</style>