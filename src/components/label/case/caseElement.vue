<template>
    <div>
        <b-form-group :label-for="`${elementType}-${optionType}`" class="mb-0">
            <b-form-tags :id="`${elementType}-${optionType}`" v-model="value" no-outer-focus class="mb-2">
                <template v-slot="{ tags, disabled, addTag, removeTag }">
                    <ul v-if="tags.length > 0" class="list-inline d-inline-block mb-2">
                        <li v-for="tag in tags" :key="tag" class="list-inline-item">
                            <b-form-tag
                                @remove="removeTag(tag)"
                                :title="tag"
                                :disabled="disabled"
                                :variant="`${elementType}`"
                            >{{ tag }}</b-form-tag>
                        </li>
                    </ul>

                    <b-dropdown size="sm" variant="outline-primary" block menu-class="w-100">
                        <template #button-content>
                            choose {{ optionType }}
                        </template>
                        <b-dropdown-form @submit.stop.prevent="() => {}">
                            <b-form-group
                                :label-for="`search-${elementType}-${optionType}`"
                                class="mb-0"
                                :disabled="disabled"
                            >
                                <b-form-input
                                    v-model="search"
                                    :id="`search-${elementType}-${optionType}`"
                                    type="search"
                                    size="sm"
                                    autocomplete="off"
                                    class="search-element"
                                ></b-form-input>
                            </b-form-group>
                        </b-dropdown-form>
                        <b-dropdown-divider></b-dropdown-divider>
                        <div class="selection-dropdown">
                            <b-dropdown-item-button
                                v-for="option in availableOptions"
                                :key="option"
                                @click="onOptionClick({ option, addTag })"
                            >{{ option }}</b-dropdown-item-button>
                            <b-dropdown-text v-if="availableOptions.length === 0">
                                No Result
                            </b-dropdown-text>
                        </div>
                    </b-dropdown>
                </template>
            </b-form-tags>
        </b-form-group>
    </div>
</template>

<script>
    export default {
        props: {
            caseName: String,
            elementType: String,
            optionType: String,
            options: Array
        },
        data() {
            return {
                search: '',
                value: []
            }
        },
        computed: {
            criteria: function () {
                // Compute the search criteria
                return this.search.trim().toLowerCase();
            },
            availableOptions: function () {
                const criteria = this.criteria;
                const options = this.options.filter(opt => this.value.indexOf(opt) === -1);
                if (criteria)
                    return options.filter(opt => opt.toLowerCase().indexOf(criteria) > -1);
                return options
            },
            active: function () {
                return this.$route.query.case ? this.$route.query.case === this.caseName : this.caseName === 'AB';
            }
        },
        created: function () {
            if (this.active) {
                this.value = this.$route.query.filters ? JSON.parse(this.$route.query.filters)[`${this.elementType}_${this.optionType}`] || [] : [];
            }
		},
        watch: {
            "$route.query": function (val) {
                if (this.active) {
                    this.value = val.filters ? JSON.parse(val.filters)[`${this.elementType}_${this.optionType}`] || [] : [];
                }
            }
        },
        methods: {
            onOptionClick: function({ option, addTag }) {
                addTag(option)
                this.search = ''
            }
        }
    }
</script>