<template>
    <div>
        <div class="commits">
            <div v-for="(commitGroup, index) in commitDetails" :key="'group-' + index">
                <a :href="`/commits/${commitGroup[0].sha1}`">
                <h3>SHA1: {{ commitGroup[0].sha1 }}</h3>
                </a>
                <ul>
                    <li v-for="(fileChange, idx) in commitGroup" :key="'commit-' + idx">
                        Path: {{ fileChange.filePath }}
                        <DiffThumbnail
                        :totalLength="Math.max(fileChange.preChangeSize, fileChange.postChangeSize)"
                        :left = "fileChange.preChangeRange"
                        :right = "fileChange.postChangeRange"
                        :microChangeLeft = "fileChange.preMicroChangeRange"
                        :microChangeRight = "fileChange.postMicroChangeRange"
                        :refactoringLeft = "fileChange.preRefactoringRange"
                        :refactoringRight = "fileChange.postRefactoringRange"
                        />
                    </li>
                </ul>
            </div>
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
      commitDetails: []
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
                const preChangeRange = commit.preChangeRange[filePath] || [];
                const postChangeRange = commit.postChangeRange[filePath] || [];
                const preMicroChangeRange = microChanges.left[filePath];
                const postMicroChangeRange = microChanges.right[filePath];
                const preRefactoringRange = refactorings.left[filePath];
                const postRefactoringRange = refactorings.right[filePath];
                return {
                    sha1: commit.sha1,
                    filePath:filePath,
                    preChangeRange: preChangeRange,
                    postChangeRange: postChangeRange,
                    preChangeSize: commit.preChangeSourceCode[filePath].split(/\r?\n/).length,
                    postChangeSize: commit.postChangeSourceCode[filePath].split(/\r?\n/).length,
                    preMicroChangeRange: preMicroChangeRange,
                    postMicroChangeRange: postMicroChangeRange,
                    preRefactoringRange: preRefactoringRange,
                    postRefactoringRange: postRefactoringRange
                }
            });
        });
        this.commitDetails = this.groupBySha1(commitDetails);
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
    }
    }
}
</script>

<style>
.commitsview{

}

.commits{

}

.diffview{

}

</style>