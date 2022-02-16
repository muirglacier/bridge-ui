import { LinkProps, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import GitHubIcon from "@material-ui/icons/GitHub";
import RedditIcon from "@material-ui/icons/Reddit";
import TelegramIcon from "@material-ui/icons/Telegram";
import TwitterIcon from "@material-ui/icons/Twitter";
import classNames from "classnames";
import React, { FunctionComponent } from "react";
import { links } from "../../constants/constants";
import { paths } from "../../pages/routes";
import { CustomLinkProps, Link } from "../links/Links";

const FooterTextLink: FunctionComponent<CustomLinkProps> = (props) => (
  <Link color="textSecondary" underline="hover" {...props} />
);

const useFooterIconLinkStyles = makeStyles(() => ({
  root: {
    fontSize: 18,
  },
}));

const FooterIconLink: FunctionComponent<LinkProps> = (props) => {
  const styles = useFooterIconLinkStyles();
  return (
    <Link
      className={styles.root}
      color="textSecondary"
      underline="none"
      {...props}
    />
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      justifyContent: "space-between",
      paddingTop: 20,
      paddingBottom: 10,
    },
  },
  rootMobile: {
    display: "block",
  },
  textLinks: {
    display: "block",
    listStyleType: "none",
    margin: 0,
    paddingLeft: 0,
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      flexDirection: "row",
    },
    "& > li": {
      margin: `0 0 8px`,
      [theme.breakpoints.up("sm")]: {
        margin: `0 8px`,
        "&:first-child": {
          marginLeft: 0,
        },
        "&:last-child": {
          marginRight: 0,
        },
      },
    },
  },
  iconLinks: {
    display: "flex",
    flexDirection: "row",
    listStyleType: "none",
    margin: 0,
    paddingLeft: 0,
    "& > li": {
      margin: `0 8px`,
      "&:first-child": {
        marginLeft: 0,
      },
      "&:last-child": {
        marginRight: 0,
      },
    },
  },
}));

type FooterProps = { mobile?: boolean };

export const Footer: FunctionComponent<FooterProps> = ({ mobile }) => {
  const styles = useStyles();
  const rootClassName = classNames(styles.root, {
    [styles.rootMobile]: mobile,
  });
  return (
    <footer className={rootClassName}>

    </footer>
  );
};
