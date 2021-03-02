<template>
    <div>
        <div class="pb-3" style="display: flex; align-items: center;">
            <h3 class="pr-1">{{ $route.query.subjectName }}</h3>
            <span class="sem-badge semgroup"><p class="sem-name">{{ $route.query.subjectSemgroup }}</p></span>
            <span class="sem-badge semtype"><p class="sem-name">{{ $route.query.objectSemtype }}</p></span>
            <h3 class="pr-1 pl-3">{{ $route.query.objectName }}</h3>
            <span class="sem-badge semgroup"><p class="sem-name">{{ $route.query.objectSemgroup }}</p></span>
            <span class="sem-badge semtype"><p class="sem-name">{{ $route.query.objectSemtype }}</p></span>
        </div>

        <b-table
            id="detailTable"
            table-class="text-center"
            striped
            :items="detailOutput"
            :fields="detailField"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #cell(PMID)="data">
                <a :href="`https://pubmed.ncbi.nlm.nih.gov/${data.value}`" target="_blank">{{ data.value }}</a>
            </template>

            <template #cell(LABEL)="data">
                <b-form-select v-model="data.item.LABEL" :options="labelOptions"></b-form-select>
            </template>
        </b-table>

        <b-button class="mr-3" variant="outline-primary" v-on:click="updateLabel">
            <b-spinner small v-show="saving"></b-spinner>
            Save
        </b-button>

        <b-pagination
            v-model="currentPage"
            :total-rows="detailRows"
            :per-page="perPage"
            aria-controls="detailTable"
            align="center"
        ></b-pagination>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                perPage: 20,
                currentPage: 1,
                detailOutput: [],
                detailField: [
                    { key: 'PMID', label: 'PMID' },
                    { key: 'PREDICATE', label: 'Predicate' },
                    { key: 'SENTENCE', label: 'Sentence' },
                    { key: 'LABEL', label: 'Label', class: 'label-column' }
                ],
                labelOptions: [
                    { value: null, text: 'None' },
                    { value: 0, text: 'Wrong' },
                    { value: 1, text: 'Correct' },
                ],
                saving: false
            }
        },
        computed: {
            detailRows: function () {
                return this.detailOutput.length;
            }
        },
        watch: {
            detailOutput: function () {
                console.log('updating');
            }
        },
        created: function() {
            this.getDetail();
        },
        methods: {
            getDetail: function () {
                this.axios({
                    method: 'GET',
                    url: '/server/dbApi/fetchDetail',
                    params: {
                        subjectName: this.$route.query.subjectName,
                        objectName: this.$route.query.objectName,
                        ids: this.$route.query.ids
                    }
                })
                .then(res => res.data)
                .then(data => {
                    this.detailOutput = data;
                })
                .catch(error => {
                    console.log(error);
                });
            },
            updateLabel: function () {
                this.saving = true;
                this.axios({
                    method: 'POST',
                    url: '/server/dbApi/updateLabel',
                    data: {
                        subjectName: this.$route.query.subjectName,
                        objectName: this.$route.query.objectName,
                        detail: this.detailOutput
                    }
                })
                .then(res => res.data)
                .then(data => {
                    console.log(data.message);
                    this.saving = false;
                })
                .catch(error => {
                    console.log(error);
                    this.saving = false;
                });
            }
        }
    }
</script>
