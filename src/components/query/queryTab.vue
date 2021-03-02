<template>
    <div>
        <div
            class="my-3"
            v-for="(query, queryIndex) in queries"
            :key="`dyn-tab-${query}`"
        >
            <b-row>
                <b-col class="pr-0">
                    <div class="selection-block p-2">
                        <b-form>
                            <b-row>
                                <b-col
                                    v-for="(elementConfig, elementType, elementTypeIndex) in elementConfigs"
                                    :key="elementTypeIndex"
                                >
                                    <div class="mb-1 text-center"><b>{{ elementConfig.label }}</b></div>
                                    <component
                                        v-for="(options, optionType, optionTypeIndex) in elementConfig.options"
                                        :key="optionTypeIndex"
                                        :is="`queryElement`"
                                        :ref="`${elementType}-${optionType}-${query}`"
                                        :elementType="elementType"
                                        :optionType="optionType"
                                        :queryId="query"
                                        :options="options"
                                    ></component>
                                </b-col>
                            </b-row>
                        </b-form>
                    </div>
                </b-col>
                <b-col cols="1"  class="pl-0 text-center">
                    <div><b-icon icon="chevron-up" @click="addPrevQuery(queryIndex)" class="click-cursor"></b-icon></div>
                    <div><b-icon icon="chevron-down" @click="addNextQuery(queryIndex)" class="click-cursor"></b-icon></div>
                    <div><b-icon icon="trash" @click="closeQuery(queryIndex)" class="click-cursor"></b-icon></div>
                    <div><b-icon icon="caret-right-fill" @click="onSubmit(query)" class="click-cursor"></b-icon></div>
                </b-col>
            </b-row>
        </div>
    </div>
</template>

<script>
    import queryElement from './queryElement.vue'

    export default {
        data() {
            return {
                queries: [1],
                queryCounter: 1,
                textOutput: '',
                elementConfigs: {
                    subject: {
                        label: 'Subject',
                        options: {
                            name: ['Amy', 'Bob', 'Cindy'],
                            semtype: ['girl', 'boy', 'cat']
                        }
                    },
                    predicate: {
                        label: 'Predicate',
                        options: {
                            name: ['is a', 'likes', 'lives in']
                        }
                    },
                    object: {
                        label: 'Object',
                        options: {
                            name: ['engineer', 'swimming', 'Taipei'],
                            semtype: ['job', 'interest', 'place']
                        }
                    }
                }
            }
        },
        components: { queryElement },
        methods: {
            addPrevQuery: function (queryIndex) {
                this.queryCounter += 1;
                this.queries.splice(queryIndex, 0, this.queryCounter);
            },
            addNextQuery: function (queryIndex) {
                this.queryCounter += 1;
                this.queries.splice(queryIndex + 1, 0, this.queryCounter);
            },
            closeQuery: function (queryIndex) {
                this.queries.splice(queryIndex, 1);
                if (this.queries.length == 0) {
                    this.queryCounter += 1;
                    this.queries = [this.queryCounter];
                }
            },
            onSubmit: function (query) {
                console.log(this.$refs[`subject-name-${query}`][0].value);
                console.log(this.$refs[`predicate-name-${query}`][0].value);
                console.log(this.$refs[`object-name-${query}`][0].value);
            }
        }
    }
</script>
