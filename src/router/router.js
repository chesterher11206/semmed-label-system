import Vue from 'vue'
import Router from 'vue-router'

// Components
import query from '../components/query.vue';
import label from '../components/label.vue';
import { casePage } from '../components/label/case';
import { detailPage } from '../components/label/detail';

// Coding
Vue.use(Router);

export default new Router({
    mode: 'history',
    scrollBehavior () {
        return { x: 0, y: 0 };
    },
    routes: [
        {
            path: '/',
            name: 'home',
            redirect: '/label',
        },
        {
            path: '/query',
            name: 'query',
            component: query,
            alias: '/query'
        },
        {
            path: '/label',
            name: 'label',
            component: label,
            redirect: '/label/case',
            children: [
                {
                    path: 'case',
                    name: 'case',
                    component: casePage
                },
                {
                    path: 'detail',
                    name: 'detail',
                    component: detailPage
                }
            ]
        }
    ]
});