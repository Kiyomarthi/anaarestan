export default defineAppConfig({
  ui: {
    theme: {
      default: "light",
    },

    colors: {
      primary: "primary",
      default: "gray",
    },

    selectMenu: {
      slots: {
        base: "w-full",
      },
    },

    input: {
      slots: {
        root: "w-full",
      },
    },
  },
});
