import { withAccountKitUi } from "@account-kit/react/tailwind";

export default withAccountKitUi(
  {
    // Your existing Tailwind config (if already using Tailwind).
    // If using Tailwind v4, this will likely be left empty.
    theme: {
      extend: {
        colors: {
          primary: 'rgb(81, 103, 255)',
          secondary: 'rgb(221, 214, 254)',
        },
      },
    },
  },
  {
    // AccountKit UI theme customizations
  },
);
