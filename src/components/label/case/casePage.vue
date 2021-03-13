<template>
    <div id="case-main">
        <b-tabs>
            <b-tab
                v-for="(child, index) in children"
				:key="index"
                :title="child.title"
                :active="caseName === child.name"
                @click="switchTab(child.name)"
            >
                <component
					:is="`caseContent`"
                    :caseName="child.name"
                    :ref="`${child.name}`"
				></component>
            </b-tab>
        </b-tabs>
    </div>
</template>

<script>
	import caseContent from './caseContent.vue'

    export default {
        data() {
            return {
                children: [
                    {title: 'A-B', name: 'AB', tabIndex: 0},
                    // {title: 'B-C', name: 'BC', tabIndex: 1}
				]
            }
        },
        computed: {
            caseName: function () {
                return this.$route.query.case || 'AB';
            }
        },
		components: { caseContent },
        methods: {
            switchTab: function (name) {
                if (this.caseName !== name) {
                    this.$router.push({
                        name: 'case',
                        query: {
                            case: name,
                            filters: this.$refs[`${name}`][0].filters
                        }
                    });
                }
            }
        }
    }
</script>
