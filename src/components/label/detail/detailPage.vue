<template>
    <div>
        <div class="pb-3 text-center">
            <h3>{{ $route.query.subjectName }} <b-icon icon="arrow-left-right" class="mx-3"></b-icon> {{ $route.query.objectName }}</h3>
        </div>

        <b-table
            id="tripletTable"
            table-class="text-center"
            table-variant="dark-table"
            head-variant="dark"
            :items="tripletOutput"
            :fields="tripletField"
            :per-page="tripletPerPage"
            :current-page="tripletCurrentPage"
            :busy="isBusy"
        >
            <template #cell(subject)="data">
                <span v-html="data.value"></span>
            </template>

            <template #cell(object)="data">
                <span v-html="data.value"></span>
            </template>

            <template #cell(label)="data">
                <b-form-select size="sm" v-model="data.item.label" :options="labelOptions" @change="labeling($event, data.index)"></b-form-select>
            </template>

            <template #cell(showDetails)="row">
                <b-form-checkbox v-model="row.detailsShowing" @change="row.toggleDetails"></b-form-checkbox>
            </template>

            <template #table-busy>
                <div class="text-center text-danger my-2">
                <b-spinner class="align-middle"></b-spinner>
                <strong>Loading...</strong>
                </div>
            </template>

            <template #row-details="row">
                <div class="px-4 pt-2">
                    <b-table
                        :id="`detailTable-${row.index}`"
                        table-class="text-center"
                        table-variant="light-table"
                        head-variant="light"
                        small
                        striped
                        :items="row.item.predications"
                        :fields="detailField"
                        :per-page="detailPerPage"
                        :current-page="detailCurrentPage[row.index]"
                    >
                        <template #cell(pmid)="data">
                            <a :href="`https://pubmed.ncbi.nlm.nih.gov/${data.value}`" target="_blank">{{ data.value }}</a>
                        </template>

                        <template #cell(subject)="data">
                            <span v-html="data.value"></span>
                        </template>

                        <template #cell(object)="data">
                            <span v-html="data.value"></span>
                        </template>
                    </b-table>
                    <b-pagination
                        v-model="detailCurrentPage[row.index]"
                        :total-rows="row.item.predications.length"
                        :per-page="detailPerPage"
                        :aria-controls="`detailTable-${row.index}`"
                        align="center"
                    ></b-pagination>
                </div>
            </template>
        </b-table>

        <b-button class="mr-3" variant="outline-primary" v-on:click="updateLabel">
            <b-spinner small v-show="saving"></b-spinner>
            Save
        </b-button>

        <b-pagination
            v-model="tripletCurrentPage"
            :total-rows="tripletRows"
            :per-page="tripletPerPage"
            aria-controls="tripletTable"
            align="center"
        ></b-pagination>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                tripletPerPage: 20,
                tripletCurrentPage: 1,
                detailPerPage: 5,
                detailCurrentPage: [],
                rawTripletOutput: [],
                tripletOutput: [],
                tripletField: [
                    { key: 'subject', label: 'Subject'},
                    { key: 'predicate', label: 'Predicate' },
                    { key: 'object', label: 'Object'},
                    { key: 'count', label: 'Count (P / A)'},
                    { key: 'range', label: 'Range'},
                    { key: 'label', label: 'Label', class: 'label-column' },
                    { key: 'showDetails', label: 'Details' }
                ],
                detailField: [
                    { key: 'pmid', label: 'PMID' },
                    { key: 'subject', label: 'Subject'},
                    { key: 'predicate', label: 'Predicate' },
                    { key: 'object', label: 'Object'},
                    { key: 'pyear', label: 'PYEAR'},
                    { key: 'sentence', label: 'Sentence', class: 'sentence-column' }
                ],
                labelOptions: [
                    { value: null, text: 'None' },
                    { value: 1, text: 'Correct' },
                    { value: 0, text: 'Wrong' },
                    { value: 2, text: 'Uncertain' },
                ],
                saving: false,
                isBusy: false
            }
        },
        computed: {
            tripletRows: function () {
                return this.tripletOutput.length;
            }
        },
        created: function() {
            this.getDetail();
        },
        methods: {
            getDetail: function () {
                this.isBusy = true;
                this.axios({
                    method: 'GET',
                    url: '/server/dbApi/fetchTriplet',
                    params: {
                        subjectName: this.$route.query.subjectName,
                        objectName: this.$route.query.objectName,
                        ids: this.$route.query.ids
                    }
                })
                .then(res => res.data)
                .then(data => {
                    this.detailCurrentPage = Array(data.length).fill(1);
                    this.rawTripletOutput = data;
                    this.tripletOutput = data.map(row => {
                        const tripletId = row['TRIPLET_ID'];

                        var subject = [row['SUBJECT_NAME']];
                        subject = subject.concat(
                            JSON.parse(row['SUBJECT_SEMGROUP']).map(s => `<span class="sem-badge semgroup"><p class="sem-name">${s}</p></span>`),
                            JSON.parse(row['SUBJECT_SEMTYPE']).map(s => `<span class="sem-badge semtype"><p class="sem-name">${s}</p></span>`)
                        ).join('&nbsp;');

                        var object = [row['OBJECT_NAME']];
                        object = object.concat(
                            JSON.parse(row['OBJECT_SEMGROUP']).map(s => `<span class="sem-badge semgroup"><p class="sem-name">${s}</p></span>`),
                            JSON.parse(row['OBJECT_SEMTYPE']).map(s => `<span class="sem-badge semtype"><p class="sem-name">${s}</p></span>`)
                        ).join('&nbsp;');

                        const predicate = row['PREDICATE'];
                        const count = `${row['COUNT_PREDICATION']} / ${row['COUNT_ARTICLE']}`;
                        const range = row['FIRST_YEAR'] == row['LAST_YEAR'] ? `${row['FIRST_YEAR']}` : `${row['FIRST_YEAR']} - ${row['LAST_YEAR']}`;
                        const label = row['LABEL'];
                        const predications = row['predications'].map(item => {
                            var predicationSubject = row['SUBJECT_NAME'] + `&nbsp;<span class="sem-badge semtype"><p class="sem-name">${item['SUBJECT_SEMTYPE']}</p></span>`;

                            var predicationObject = row['OBJECT_NAME'] + `&nbsp;<span class="sem-badge semtype"><p class="sem-name">${item['OBJECT_SEMTYPE']}</p></span>`;

                            const pmid = item['PMID'];
                            const pyear = item['PYEAR'];
                            const sentence = item['SENTENCE'];

                            return { pmid, subject: predicationSubject, predicate, object: predicationObject, pyear, sentence };
                        });

                        return { tripletId, subject, predicate, object, count, range, label, predications };
                    });
                })
                .then(() => {
                    this.isBusy = false;
                })
                .catch(error => {
                    console.log(error);
                });
            },
            labeling: function (label, index) {
                this.rawTripletOutput[index].LABEL = label;
            },
            updateLabel: function () {
                this.saving = true;
                this.axios({
                    method: 'POST',
                    url: '/server/dbApi/updateLabel',
                    data: {
                        subjectName: this.$route.query.subjectName,
                        objectName: this.$route.query.objectName,
                        triplet: this.rawTripletOutput
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
