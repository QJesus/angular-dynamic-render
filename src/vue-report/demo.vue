<style>
  #app {
    background: #308461;
  }

</style>

<template>
  <div id="app">
    <h3 v-bind:key="o" v-bind:title="message" v-on:click="click(o)" v-for="o in [1,2,3,4,5]">
      dynamic render from v.html by vue
      <p>{{message}} {{o}}</p>
    </h3>
  </div>
</template>

<script>
  var app1 = new Vue({
    el: '#app',
    data: {
      message: 'Hello Vue!'
    },
    methods: {
      click: function (n) {
        console.log(this.message + n);
      }
    }
  });
</script>
