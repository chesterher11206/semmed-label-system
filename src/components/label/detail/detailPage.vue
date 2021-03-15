<template>
    <div>
        <component
            :is="`detailContent`"
            :subjectName="$route.query.subjectName"
            :objectName="$route.query.objectName"
            :ids="JSON.parse($route.query.ids)"
        ></component>
    </div>
</template>

<script>
    import detailContent from './detailContent.vue'

    export default {
        components: { detailContent }
    }
</script>
