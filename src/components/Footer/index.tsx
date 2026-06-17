import { DefaultFooter } from "@ant-design/pro-components";
import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <DefaultFooter
      copyright={`${currentYear} 融科智联`}
      style={{
        background: "#fff",
      }}
    />
  );
};

export default Footer;
