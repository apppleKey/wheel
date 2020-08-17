<template>
  <div class="dialog" :style="'z-Index:'+zIndex+';'">
    <div class="dia-header">
      {{title}}
      <span @click="hide">X</span>
    </div>
    <div class="dia-body">
      <button @click="submit">确定</button>
      <button @click="cancel">取消</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      default: "-",
    },
    zIndex:{

    }
  },
  data() {
    return {
      isShow: false,
    };
  },
  methods: {
    show() {
      this.isShow = true;
      setTimeout(() => {
        this.hide();
      }, 3000);
    },
    hide() {
      this.isShow = false;
      this.remove();
      this.$destroy(true);
    },
    close() {
      this.hide();
    },
    submit() {
      this.hide();
      this.resolve && this.resolve("成功");
    },
    cancel() {
      this.hide();
      this.resolve && this.reject("失败");
    },
  },
};
</script>

<style>
.dialog {
  width: 100px;
  height: 100px;
  background-color: red;
  position: fixed;
  left: 50%;
  top: 50%;
}
</style>
