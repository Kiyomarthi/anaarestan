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
        base: "h-10",
      },
    },

    skeleton: {
      base: "animate-pulse rounded-md bg-gray-200",
    },

    textarea: {
      slots: {
        root: "w-full",
      },
    },

    modal: {
      slots: {
        overlay: "bg-black/35! backdrop-blur-xs",
      },
    },
  },
});
