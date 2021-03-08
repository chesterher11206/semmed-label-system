<template>
    <div class="my-3">
        <b-row>
            <b-col class="pr-0">
                <div class="selection-block py-2 px-3">
                    <b-form>
                        <b-row>
                            <b-col
                                v-for="(elementConfig, elementType, elementTypeIndex) in caseConfig"
                                :key="elementTypeIndex"
                            >
                                <div class="mb-1 text-center"><b>{{ elementConfig.label }}</b></div>
                                <component
                                    v-for="(options, optionType, optionTypeIndex) in elementConfig.options"
                                    :key="optionTypeIndex"
                                    :is="`caseElement`"
                                    :ref="`${elementType}-${optionType}`"
                                    :caseName="caseName"
                                    :elementType="elementType"
                                    :optionType="optionType"
                                    :options="options"
                                ></component>
                            </b-col>
                        </b-row>
                    </b-form>
                </div>
            </b-col>
            <b-col cols="1"  class="pl-0 text-center">
                <div><b-icon icon="funnel-fill" @click="buildFilter" class="click-cursor"></b-icon></div>
            </b-col>
        </b-row>

        <div class="mt-4">
            <b-table
                id="caseTable"
                table-class="text-center"
                table-variant="dark-table"
                head-variant="dark"
                :items="caseOutput"
                :fields="caseField"
                :busy="isBusy"
                select-mode="single"
                selectable
                @row-selected="showDetail"
            >
                <template #cell(subject)="data">
                    <span v-html="data.value"></span>
                </template>
                <template #cell(object)="data">
                    <span v-html="data.value"></span>
                </template>
                <template #cell(progress)="data">
                    <b-progress :max="data.item.total" height="2rem">
                        <b-progress-bar :value="data.item.labeled"></b-progress-bar>
                        <div class="progress-bar-title"><strong>{{ data.item.labeled }} / {{ data.item.total }}</strong></div>
                    </b-progress>
                </template>
                <template #table-busy>
                    <div class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                    </div>
                </template>
            </b-table>
            <b-pagination
                v-model="currentPage"
                :total-rows="caseRows"
                :per-page="perPage"
                align="center"
                @change="pageChange"
            ></b-pagination>
        </div>
    </div>
</template>

<script>
    import caseElement from './caseElement.vue'

    export default {
        props: {
            caseName: String
        },
        data() {
            return {
                filters: '',
                perPage: 20,
                currentPage: 1,
                caseRows: 0,
                caseConfig: {},
                caseOutput: [],
                caseField: [
                    { key: 'subject', label: 'Subject'},
                    { key: 'object', label: 'Object'},
                    { key: 'count', label: 'Count (P / A)'},
                    { key: 'range', label: 'Range'},
                    { key: 'progress', label: 'Progress', class: 'progress-column' }
                ],
                isBusy: false
            }
        },
        computed: {
            active: function () {
                return this.$route.query.case ? this.$route.query.case === this.caseName : this.caseName === 'AB';
            }
        },
        watch: {
            "$route.query": function (val) {
                if (this.active) {
                    this.filters = val.filters || JSON.stringify({});
                    this.currentPage = this.$route.query.page || 1;
                    this.filterDatabase();
                }
            }
        },
        created: function () {
            if (this.active) {
                this.filters = this.$route.query.filters || JSON.stringify({});
                this.currentPage = this.$route.query.page || 1;
                this.getCaseConfig();
                this.filterDatabase();
            }
		},
        components: { caseElement },
        methods: {
            getCaseConfig: function () {
                this.axios({
                    method: 'GET',
                    url: '/server/dbApi/fetchCaseConfig',
                    params: {
                        case: this.caseName
                    }
                })
                .then(res => res.data)
                .then(data => {
                    this.caseConfig = data;
                });
            },
            buildFilter: function () {
                var filters = {};
                for (var entityName in this.caseConfig) {
                    for (var optionName in this.caseConfig[entityName].options) {
                        const filterKey = `${entityName}_${optionName}`;
                        const filterValue = this.$refs[`${entityName}-${optionName}`][0].value;
                        if (filterValue.length != 0) {
                            filterValue.sort();
                            filters[filterKey] = filterValue;
                        }
                    }
                }
                filters = Object.fromEntries(Object.entries(filters).sort());

                this.$router.push({
                    name: 'case',
                    query: {
                        case: this.caseName,
                        filters: JSON.stringify(filters)
                    }
                });                
            },
            filterDatabase: function () {
                this.isBusy = true;
                this.axios({
                    method: 'GET',
                    url: '/server/dbApi/fetchCase',
                    params: {
                        case: this.caseName,
                        filters: this.filters,
                        perPage: this.perPage,
                        page: this.currentPage
                    }
                })
                .then(res => {
                    this.caseRows = res.data.totalRows;
                    return res.data.result;
                })
                .then(data => {
                    this.caseOutput = data.map(row => {
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

                        const count = `${row['COUNT_PREDICATION']} / ${row['COUNT_ARTICLE']}`;
                        const range = row['FIRST_YEAR'] == row['LAST_YEAR'] ? `${row['FIRST_YEAR']}` : `${row['FIRST_YEAR']} - ${row['LAST_YEAR']}`;
                        const ids = row['TRIPLET_IDS'];
                        const labeled = row['labeled'];
                        const total = JSON.parse(ids).length;

                        return { subject, object, count, range, ids, labeled, total };
                    });
                })
                .then(() => {
                    this.isBusy = false;
                })
                .catch(error => {
                    console.log(error);
                });
            },
            pageChange: function (page) {
                this.$router.push({
                    name: 'case',
                    query: {
                        case: this.caseName,
                        filters: this.filters,
                        page
                    }
                });
            },
            showDetail: function (items) {
                var [subjectName] = items[0].subject.split('&nbsp;');
                var [objectName] = items[0].object.split('&nbsp;');
                var ids = items[0].ids;

                this.$router.push({
                    name: 'detail',
                    query: {
                        subjectName, objectName, ids
                    }
                });
            }
        }
    }
</script>
