import React, { FunctionComponent, useCallback, useState } from "react";
import { makeStyles } from "@material-ui/core";
import classNames from "classnames";
import {DEV} from "../../constants/environmentVariables"
const useStyles = makeStyles({
  root: {
    background: "lightgray",
  },
  wrapper: {
    background: "gray",
    overflow: "hidden",
    height: 5,
    "&:hover": {
      height: 10,
    },
  },
  wrapperEnabled: {
    height: "auto",
    "&:hover": {
      height: "auto",
    },
  },
});

const off = DEV == false;

type DebugProps = {
  it: any;
  force?: boolean;
  disable?: boolean;
  wrapper?: boolean;
};


type DebugWrapperProps = {
  enabled: boolean;
};



const DebugWrapper: FunctionComponent<DebugWrapperProps> = ({
  enabled,
  children,
}) => {
  const classes = useStyles();
  const [show, setShow] = useState(false);
  const toggleShow = useCallback(() => {
    setShow(!show);
  }, [show]);
  if (!enabled) {
    return <>{children}</>;
  }
  const className = classNames(classes.wrapper, {
    [classes.wrapperEnabled]: show,
  });
  return (
    <div className={className} onClick={toggleShow}>
      {children}
    </div>
  );
};

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key : any, value : any) => {
    if (value && value.type === "Buffer") {
      return "buffer";
    }
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export const Debug: FunctionComponent<DebugProps> = ({
  it,
  force,
  disable,
  wrapper,
  children,
}) => {
  const classes = useStyles();
  const target = it || children;
  const show = !off || force;
  const noClick = useCallback((event) => {
    event.stopPropagation();
  }, []);
  return show && !disable ? (
    <DebugWrapper enabled={!!wrapper}>
      <pre className={classes.root} onClick={noClick}>
        {JSON.stringify(target, getCircularReplacer(), 2)}
      </pre>
    </DebugWrapper>
  ) : null;
};

export const DebugComponentProps: FunctionComponent<any> = (props) => (
  <Debug it={props} />
);
