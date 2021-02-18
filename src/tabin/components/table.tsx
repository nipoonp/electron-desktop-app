import React from "react";
const styles = require("./table.module.css");

export default (props: IProps) => {
  return (
    <table className={`${styles.table} ${props.className}`}>
      {props.children}
    </table>
  );
};

interface IProps {
  children: React.ReactNode;
  className?: string;
}

// export default React.forwardRef(Button);
