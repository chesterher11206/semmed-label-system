<template>
    <div id="main-container">
        <b-navbar toggleable="lg" type="light" variant="primary">
            <b-navbar-brand to="/" class="main-navbar-brand">Semmed Label System</b-navbar-brand>

            <b-navbar-nav>
                <b-nav-item
                    v-for="(item, index) in navs"
                    :key="index"
                    :to="item.link"
                    class="col"
                >{{ item.title }}</b-nav-item>
            </b-navbar-nav>
        </b-navbar>

        <router-view></router-view>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                navs: [
                    // {title: 'Query', link: '/query'},
                    {title: 'Label', link: '/label'}
                ]
            }
        }
    };
</script>

<style scoped></style>