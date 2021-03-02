<template>
    <div id="main">
        <b-tabs v-model="activeTabIndex" active-nav-item-class="active-query-tab">
            <b-tab
                v-for="(tab, tabIndex) in tabs"
                :key="`dyn-tab-${tab}`"
                active
            >
                <template #title>
                    Tab {{ tab }}
                    <b-icon
                        class="close-query-tab"
                        icon="x"
                        @click="closeTab(tab)"
                        v-show="activeTabIndex == tabIndex"
                    ></b-icon>
                </template>

                <component
                    :is="`queryTab`"
                ></component>
            </b-tab>

            <!-- New Tab Button (Using tabs-end slot) -->
            <template #tabs-end>
                <b-nav-item role="presentation" @click.prevent="newTab" href="#"><b>+</b></b-nav-item>
            </template>

            <!-- Render this if no tabs -->
            <template #empty>
                <div class="text-center text-muted">
                    There are no open tabs<br>
                    Open a new tab using the <b>+</b> button above.
                </div>
            </template>
        </b-tabs>
    </div>
</template>

<script>
    import { queryTab } from './query'

    export default {
        data() {
            return {
                tabs: [1],
                tabCounter: 1,
                activeTabIndex: 0,
                toolInfos: [
                    {
                        text: 'Tokenization / POS',
                        value: 'pos'
                    },
                    {
                        text: 'Named Entity Recognition',
                        value: 'ner'
                    },
                    {
                        text: 'Automatic Keyword Extraction',
                        value: 'ake'
                    },
                    {
                        text: 'Multi-word Terms Extraction',
                        value: 'mwt'
                    }
                ]
            }
        },
        components: { queryTab },
        methods: {
            closeTab: function (x) {
                for (let i = 0; i < this.tabs.length; i++) {
                    if (this.tabs[i] === x)
                        this.tabs.splice(i, 1);
                }
            },
            newTab: function () {
                this.tabCounter += 1;
                this.tabs.push(this.tabCounter);
            }
        }
    }
</script>

<style></style>