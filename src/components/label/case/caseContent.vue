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
                <div><b-icon icon="funnel-fill" @click="buildFilter()" class="click-cursor"></b-icon></div>
            </b-col>
        </b-row>

        <div class="mt-4 mb-1">
            <b>Result</b>
        </div>

        <b-table
            id="caseTable"
            table-class="text-center"
            striped
            :items="caseOutput"
            :fields="caseField"
            :per-page="perPage"
            :current-page="currentPage"
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
        </b-table>
        <b-pagination
            v-model="currentPage"
            :total-rows="caseRows"
            :per-page="perPage"
            aria-controls="caseTable"
            align="center"
        ></b-pagination>
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
                caseConfig: {},
                caseOutput: [],
                caseField: [
                    { key: 'subject', label: 'Subject'},
                    { key: 'object', label: 'Object'},
                    { key: 'count', label: 'Count (P / A)'},
                    { key: 'range', label: 'Range'},
                ]
            }
        },
        computed: {
            caseRows: function () {
                return this.caseOutput.length;
            },
            active: function () {
                return this.$route.query.case ? this.$route.query.case === this.caseName : this.caseName === 'AB';
            }
        },
        watch: {
            "$route.query": function (val) {
                if (this.active) {
                    this.filters = val.filters;
                    this.filterDatabase();
                }
            }
        },
        created: function () {
            if (this.active) {
                this.filters = this.$route.query.filters || JSON.stringify({});
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
                this.axios({
                    method: 'GET',
                    url: '/server/dbApi/fetchCase',
                    params: {
                        case: this.caseName,
                        filters: this.filters
                    }
                })
                .then(res => res.data)
                .then(data => {
                    this.caseOutput = data.map(row => {
                        var subject = `${row['SUBJECT_NAME']}`;
                        subject += row['SUBJECT_SEMGROUP'] ? `&nbsp;<span class="sem-badge semgroup"><p class="sem-name">${row['SUBJECT_SEMGROUP']}</p></span>` : '';
                        subject += row['SUBJECT_SEMTYPE'] ? `&nbsp;<span class="sem-badge semtype"><p class="sem-name">${row['SUBJECT_SEMTYPE']}</p></span>` : '';

                        var object = `${row['OBJECT_NAME']}`;
                        object += row['OBJECT_SEMGROUP'] ? `&nbsp;<span class="sem-badge semgroup"><p class="sem-name">${row['OBJECT_SEMGROUP']}</p></span>` : '';
                        object += row['OBJECT_SEMTYPE'] ? `&nbsp;<span class="sem-badge semtype"><p class="sem-name">${row['OBJECT_SEMTYPE']}</p></span>` : '';

                        const count = `${row['COUNT_PREDICATION']} / ${row['COUNT_ARTICLE']}`;
                        const range = row['FIRST_YEAR'] == row['LAST_YEAR'] ? `${row['FIRST_YEAR']}` : `${row['FIRST_YEAR']} - ${row['LAST_YEAR']}`;
                        const ids = row['PREDICATION_IDS'];

                        return { subject, object, count, range, ids };
                    });
                });
            },
            showDetail: function (items) {
                var [subjectName, subjectSemgroupString, subjectSemtypeString] = items[0].subject.split('&nbsp;');
                var [objectName, objectSemgroupString, objectSemtypeString] = items[0].object.split('&nbsp;');
                var subjectSemgroup = new DOMParser().parseFromString(subjectSemgroupString, 'text/xml').querySelector('span.semgroup p').textContent;
                var subjectSemtype = new DOMParser().parseFromString(subjectSemtypeString, 'text/xml').querySelector('span.semtype p').textContent;
                var objectSemgroup = new DOMParser().parseFromString(objectSemgroupString, 'text/xml').querySelector('span.semgroup p').textContent;
                var objectSemtype = new DOMParser().parseFromString(objectSemtypeString, 'text/xml').querySelector('span.semtype p').textContent;
                var ids = items[0].ids;

                this.$router.push({
                    name: 'detail',
                    query: {
                        subjectName, objectName, subjectSemgroup, subjectSemtype, objectSemgroup, objectSemtype, ids
                    }
                });
            }
        }
    }
</script>
