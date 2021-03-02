import './scss/all.scss';

import Vue from 'vue';
import App from './App.vue';
import router from './router/router.js';

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import axios from 'axios';
import VueAxios from 'vue-axios';


Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(VueAxios, axios);

new Vue({
    el: '#app',
    mounted : function(){
        console.log('Hello Webpack and Vue!');	 
    },
    router,
    components:{
        App
    },
    template: '<App />'
});