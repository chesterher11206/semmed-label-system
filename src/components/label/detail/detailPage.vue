<template>
    <div id="detail-main">
        <div
            v-for="(type, index) in tripletType"
			:key="index"
            class="pt-2"
        >
            <div class="pb-3 text-center" style="font-size: 22px;">
                <strong>{{ tripletEntity[type].subject }}<b-icon icon="arrow-right" class="mx-3"></b-icon>{{ tripletEntity[type].object }}</strong>
            </div>

            <b-table
                :id="`triplet-table-${type}`"
                table-class="text-center"
                table-variant="dark-table"
                head-variant="dark"
                :items="tripletOutput[type]"
                :fields="tripletField"
                :per-page="tripletPerPage"
                :current-page="tripletCurrentPage[type]"
                :busy="loadingTriplet[type]"
            >
                <template #head(count)="data">
                    <span v-html="data.label"></span>
                </template>

                <template #cell(subject)="data">
                    <span v-html="data.value"></span>
                </template>

                <template #cell(object)="data">
                    <span v-html="data.value"></span>
                </template>

                <template #cell(label)="data">
                    <b-form-select size="sm" v-model="data.item.label" :options="labelOptions" @change="labeling(type, data.index, $event)"></b-form-select>
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
                            :id="`detailTable-${type}-${row.index}`"
                            table-class="text-center"
                            table-variant="light-table"
                            head-variant="light"
                            small
                            striped
                            :items="row.item.predications"
                            :fields="detailField"
                            :per-page="detailPerPage"
                            :current-page="detailCurrentPage[type][row.index]"
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
                            v-model="detailCurrentPage[type][row.index]"
                            :total-rows="row.item.predications.length"
                            :per-page="detailPerPage"
                            :aria-controls="`detailTable-${type}-${row.index}`"
                            align="center"
                        ></b-pagination>
                    </div>
                </template>
            </b-table>

            <b-pagination
                v-model="tripletCurrentPage[type]"
                :total-rows="tripletRows"
                :per-page="tripletPerPage"
                :aria-controls="`triplet-table-${type}`"
                align="center"
            ></b-pagination>
        </div>
        <b-button class="mr-3" variant="outline-primary" v-on:click="updateLabel">
            <b-spinner small v-show="saving"></b-spinner>
            Save
        </b-button>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                tripletType: ['normal', 'reverse'],
                tripletEntity: {
                    normal: { subject: this.$route.query.subjectName, object: this.$route.query.objectName },
                    reverse: { subject: this.$route.query.objectName, object: this.$route.query.subjectName },
                },
                tripletPerPage: 20,
                tripletCurrentPage: { normal: 1, reverse: 1 },
                detailPerPage: 5,
                detailCurrentPage: { normal: [], reverse: [] },
                rawTripletOutput: { normal: [], reverse: [] },
                tripletOutput: { normal: [], reverse: [] },
                tripletField: [
                    { key: 'subject', label: 'Subject', class: 'triplet-subject-column'},
                    { key: 'predicate', label: 'Predicate' },
                    { key: 'object', label: 'Object'},
                    { key: 'count', label: 'Count<br>(Predication / Article)', class: 'count-column'},
                    { key: 'range', label: 'Range', class: 'range-column'},
                    { key: 'label', label: 'Label', class: 'label-column' },
                    { key: 'showDetails', label: 'Details', class: 'show-detail-column' }
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
                    { value: 3, text: 'Meaningless' }
                ],
                saving: false,
                loadingTriplet: { normal: false, reverse: false }
            }
        },
        computed: {
            tripletRows: function () {
                return this.tripletOutput.length;
            }
        },
        created: function() {
            this.getTriplet();
        },
        methods: {
            getTriplet: function () {
                Promise.all(this.tripletType.map(t => this.fetchTriplet(t)))
                .then(() => {
                    console.log('Success');
                })
                .catch(error => {
                    console.log(error);
                });
            },
            fetchTriplet: function (type) {
                this.loadingTriplet[type] = true;
                this.axios({
                    method: 'GET',
                    url: '/server/dbApi/fetchTriplet',
                    params: {
                        subjectName: this.tripletEntity[type].subject,
                        objectName: this.tripletEntity[type].object,
                        ids: JSON.parse(this.$route.query.ids)[type]
                    }
                })
                .then(res => res.data)
                .then(data => {
                    this.detailCurrentPage[type] = Array(data.length).fill(1);
                    this.rawTripletOutput[type] = data;
                    this.tripletOutput[type] = data.map(row => {
                        const tripletId = row['TRIPLET_ID'];

                        var subject = row['SUBJECT_NAME'];
                        subject = subject + '<br>' + [].concat(
                            JSON.parse(row['SUBJECT_SEMGROUP']).map(s => `<span class="sem-badge semgroup"><p class="sem-name">${s}</p></span>`),
                            JSON.parse(row['SUBJECT_SEMTYPE']).map(s => `<span class="sem-badge semtype"><p class="sem-name">${s}</p></span>`)
                        ).join('&nbsp;');

                        var object = row['OBJECT_NAME'];
                        object = object + '<br>' + [].concat(
                            JSON.parse(row['OBJECT_SEMGROUP']).map(s => `<span class="sem-badge semgroup"><p class="sem-name">${s}</p></span>`),
                            JSON.parse(row['OBJECT_SEMTYPE']).map(s => `<span class="sem-badge semtype"><p class="sem-name">${s}</p></span>`)
                        ).join('&nbsp;');

                        const predicate = row['PREDICATE'];
                        const count = `${row['COUNT_PREDICATION']} / ${row['COUNT_ARTICLE']}`;
                        const range = row['FIRST_YEAR'] == row['LAST_YEAR'] ? `${row['FIRST_YEAR']}` : `${row['FIRST_YEAR']} - ${row['LAST_YEAR']}`;
                        const label = row['LABEL'];
                        const predications = row['predications'].map(item => {
                            var predicationSubject = row['SUBJECT_NAME'] + `<br><span class="sem-badge semtype"><p class="sem-name">${item['SUBJECT_SEMTYPE']}</p></span>`;

                            var predicationObject = row['OBJECT_NAME'] + `<br><span class="sem-badge semtype"><p class="sem-name">${item['OBJECT_SEMTYPE']}</p></span>`;

                            const pmid = item['PMID'];
                            const pyear = item['PYEAR'];
                            const sentence = item['SENTENCE'];

                            return { pmid, subject: predicationSubject, predicate, object: predicationObject, pyear, sentence };
                        });

                        return { tripletId, subject, predicate, object, count, range, label, predications };
                    });
                })
                .then(() => {
                    this.loadingTriplet[type] = false;
                })
                .catch(error => {
                    console.log(error);
                });
            },
            labeling: function (type, index, label) {
                this.rawTripletOutput[type][index].LABEL = label;
            },
            updateLabel: function () {
                if (localStorage.getItem('jwt') == null) {
                    this.$router.push({
                        name: 'login',
                        query: {
                            nextUrl: this.$route.fullPath
                        }
                    });
                }

                this.saving = true;
                this.callUpdate('normal')
                .then(() => this.callUpdate('reverse'))
                .then(() => {
                    this.saving = false;
                })
                .catch(error => {
                    console.log(error);
                    this.saving = false;
                });
            },
            callUpdate: function (type) {
                return this.axios({
                    method: 'POST',
                    url: '/server/dbApi/updateLabel',
                    data: {
                        subjectName: this.tripletEntity[type].subject,
                        objectName: this.tripletEntity[type].object,
                        triplet: this.rawTripletOutput[type]
                    }
                })
                .then(res => res.data)
                .catch(error => {
                    console.log(error);
                });
            }
        }
    }
</script>
