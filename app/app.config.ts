export default defineAppConfig({
  ui: {
    theme: {
      default: "light",
    },

    colors: {
      primary: "primary",
      default: "gray",
      gray: "gray",
      info: "info",
      success: "success",
      warning: "warning",
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

    textarea: {
      slots: {
        root: "w-full",
      },
    },
  },
});
