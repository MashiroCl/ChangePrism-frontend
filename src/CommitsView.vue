<template>
    <div class="container">
        <div class="timeline-container">
            <TimeLine :commits="commitDetails" @commitClicked="scrollToCommit"/>
        </div>
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
            <button @click="updateThumbnails" :style="{ marginLeft: '50px' }">Filter</button>
        </div>
        <div class="commits">
            <!-- Commit Group section -->
            <section v-for="(commitGroup, index) in filteredCommitDetails" :key="'group-' + index" :ref="'group-' + index" class="commit-group">
                <!-- Commit SHA1 and link -->
                <div class="commit-header">
                    <a :href="`/commits/${commitGroup[0].sha1}`" class="commit-link">
                        <h3 class="commit-title">Commit: {{ commitGroup[0].sha1 }}</h3>
                    </a>
                    <button @click="viewCommitDetails(commitGroup[0].sha1)" class="view-thumbnails-button">View Commit Insight</button>
                </div>
                <a :href="`${commitGroup[0].url}`">{{commitGroup[0].url}}</a>

                <!-- File changes list with DiffThumbnail on the right -->
                <div class="files-container">
                    <ul>
                        <li v-for="(fileChange, idx) in commitGroup" :key="'file-' + idx" class="file-change">
                            <div class="file-details">
                                <div class="file-path">{{ fileChange.filePath }}</div>
                            </div>
                            <div class="thumbnail-container">
                                <DiffThumbnail
                                    :key="`file-${idx}-${uniqueKey}`"
                                    :leftHeight="fileChange.preChangeSize"
                                    :rightHeight="fileChange.postChangeSize"
                                    :addition="fileChange.additionChangeRange"
                                    :removal="fileChange.removalChangeRange"
                                    :modificationLeft="fileChange.modificationLeftChangeRange"
                                    :modificationRight="fileChange.modificationRightChangeRange"
                                    :microChangeLeft="fileChange.preMicroChangeRange"
                                    :microChangeRight="fileChange.postMicroChangeRange"
                                    :refactoringLeft="fileChange.preRefactoringRange"
                                    :refactoringRight="fileChange.postRefactoringRange"
                                    :refactoringTypesLeft="fileChange.refactoringTypesLeft"
                                    :refactoringTypesRight="fileChange.refactoringTypesRight"
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
import TimeLine from "./components/Timeline.vue";

export default {
    name: 'CommitsView',
    components: {
        DiffThumbnail,
        TimeLine
    },
    data() {
        return {
            commitDetails: [],
            showModification: true,
            showChanges: true,
            showMicroChanges: true,
            showRefactorings: true,
            uniqueKey: 0,
            filteredCommitDetails: [],
            textualChangeColor: "yellow"
        };
    },
    mounted() {
        this.fetchCommitData();
    },
    methods: {
        async fetchCommitData() {
            const apiUrl = `http://localhost:8081/commits/`;
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                const commitDetails = data.flatMap(commit => {
                    // collect the microchanges & refactorings
                    const microChanges = this.extractFromSpecialChange(commit.microChanges);
                    const refactorings = this.extractFromSpecialChange(commit.refactorings);
                    const url = commit.url;
                    // console.log("commit (general)", commit);
                    // console.log("refactorings (general)", refactorings);
                    return Object.keys(commit.preChangeSourceCode).map(filePath => {
                        const additionChangeRange = commit.addition[filePath] || [];
                        const removalChangeRange = commit.removal[filePath] || [];
                        const modificationLeftChangeRange = commit.modificationLeft[filePath] || [];
                        const modificationRightChangeRange = commit.modificationRight[filePath] || [];
                        const preMicroChangeRange = microChanges.left[filePath];
                        const postMicroChangeRange = microChanges.right[filePath];
                        const preRefactoringRange = refactorings.left[filePath];
                        const postRefactoringRange = refactorings.right[filePath];
                        const refactoringTypesLeft = refactorings.leftTypes[filePath];
                        const refactoringTypesRight = refactorings.rightTypes[filePath];

                        // console.log("refactoringTypes", filePath, refactoringTypesLeft);
                        return {
                            sha1: commit.sha1,
                            filePath: filePath,
                            url: url,
                            additionChangeRange: this.showModification ? additionChangeRange : [],
                            removalChangeRange: this.showModification ? removalChangeRange : [],
                            modificationLeftChangeRange: this.showChanges ? modificationLeftChangeRange : [],
                            modificationRightChangeRange: this.showChanges ? modificationRightChangeRange : [],
                            preChangeSize: commit.preChangeSourceCode[filePath].split(/\r?\n/).length,
                            postChangeSize: commit.postChangeSourceCode[filePath].split(/\r?\n/).length,
                            preMicroChangeRange: this.showMicroChanges ? preMicroChangeRange : [],
                            postMicroChangeRange: this.showMicroChangeRange ? postMicroChangeRange : [],
                            preRefactoringRange: this.showRefactorings ? preRefactoringRange : [],
                            postRefactoringRange: this.showRefactorings ? postRefactoringRange : [],
                            refactoringTypesLeft: this.showRefactorings ? refactoringTypesLeft : [],
                            refactoringTypesRight: this.showRefactorings ? refactoringTypesRight : []
                        };
                    });
                });
                this.commitDetails = this.groupBySha1(commitDetails);
                this.updateThumbnails();
            } catch (error) {
                console.error('Error fetching commit data:', error);
            }
        },
        viewCommitDetails(sha1) {
            this.$router.push({ name: 'commit-thumbnails', params: { sha1 } });
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

            // for (const path in grouped.left) {
            //     this.sortRanges(grouped.left[path]);
            // }
            // for (const path in grouped.right) {
            //     this.sortRanges(grouped.right[path]);
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
        getsha1(data) {
            data.forEach(item => {
                if (item.sha1) {
                    this.sha1s.push(item.sha1);
                }
            });
        },
        updateThumbnails() {
            this.filteredCommitDetails = this.commitDetails.map(commitGroup =>
                commitGroup.map(fileChange => ({
                    ...fileChange,
                    additionChangeRange: this.showChanges ? fileChange.additionChangeRange : [],
                    removalChangeRange: this.showChanges ? fileChange.removalChangeRange : [],
                    modificationLeftChangeRange: this.showModification ? fileChange.modificationLeftChangeRange : [],
                    modificationRightChangeRange: this.showModification ? fileChange.modificationRightChangeRange : [],
                    preMicroChangeRange: this.showMicroChanges ? fileChange.preMicroChangeRange : [],
                    postMicroChangeRange: this.showMicroChanges ? fileChange.postMicroChangeRange : [],
                    preRefactoringRange: this.showRefactorings ? fileChange.preRefactoringRange : [],
                    postRefactoringRange: this.showRefactorings ? fileChange.postRefactoringRange : [],
                    refactoringTypesLeft: this.showRefactorings ? fileChange.refactoringTypesLeft : [],
                    refactoringTypesRight: this.showRefactorings ? fileChange.refactoringTypesRight : []
                }))
            );
            this.uniqueKey++; // Change the unique key to force re-rendering
        },
        scrollToCommit(commit) {
            const index = this.commitDetails.findIndex(group => group[0].sha1.replace(/^'|'$/g, '') === commit[0].sha1);
            if (index !== -1) {
                const element = this.$refs['group-' + index][0];
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }
};
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

.commit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
}

.commit-link {
    text-decoration: none;
    color: #3498db;
}

.commit-link:hover {
    text-decoration: underline;
}

.commit-title {
    margin: 0;
}

.view-thumbnails-button {
    margin-left: auto;
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
    margin-bottom: 20px; /* Adjust space between filter bar and content */
    padding: 15px;
    background: #ffffff;
    border: 1px solid #ddd;
    border-radius: 8px;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
