import { Container, Grid } from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import React, { FunctionComponent, ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { HomeMenuIconButton } from "../buttons/Buttons";
import { BetaIcon, RenBridgeLogoIcon, BridgeLogoIcon } from "../icons/RenIcons";
import { Footer } from "./Footer";

const headerHeight = 112;
const footerHeight = 80;

export const useMobileLayoutStyles = makeStyles((theme: Theme) => ({
  grow: {
    minHeight: headerHeight,
    flexGrow: 1,
  },
  main: {
    paddingTop: 1,
    marginTop: -1,
    minHeight: `calc(100vh - ${headerHeight + footerHeight}px)`,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    marginRight: 40,
  },
  beta: {
    marginLeft: 8,
    marginTop: -10,
  },
  desktopMenu: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "flex",
    },
  },
  desktopTxHistory: {
    marginRight: 20,
  },
  mobileTxHistory: {
    marginRight: 16,
  },
  mobileMenu: {
    display: "flex",
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  mobileMenuButton: {
    padding: "0 0",
    minHeight: 40,
    "&:hover": {
      backgroundColor: "transparent", // list item handles hover styles
    },
  },
  drawerLogo: {
    fontSize: 20,
  },
  drawerPaper: {
    paddingTop: 0,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 0,
    minWidth: 300,
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  drawerClose: {
    cursor: "pointer",
    fontSize: 26,
  },
  drawerListItem: {
    padding: `16px 0`,
  },
  drawerFooterListItem: {
    paddingBottom: 15,
    flexGrow: 2,
    alignItems: "flex-end",
  },
  drawerListItemIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
    marginRight: 16,
  },
}));

const noBackgroundClassName = "bodyNoBackground";
const useBackgroundReplacer = (withBackground: boolean) =>
  useEffect(() => {
    if (withBackground) {
      document.body.classList.remove(noBackgroundClassName);
    } else {
      document.body.classList.add(noBackgroundClassName);
    }
  }, [withBackground]);

export type MainLayoutVariantProps = {
  withBackground?: boolean;
};

type MobileLayoutProps = MainLayoutVariantProps & {
  ToolbarMenu?: ReactNode | "";
  DrawerMenu?: ReactNode | "";
  WalletMenu?: ReactNode | "";
  Logo?: ReactNode | "";
};

export const MobileLayout: FunctionComponent<MobileLayoutProps> = ({
  withBackground,
  ToolbarMenu = "",
  DrawerMenu,
  WalletMenu,
  Logo,
  children,
}) => {
  const styles = useMobileLayoutStyles();
  useBackgroundReplacer(Boolean(withBackground));

  return (
    <>
    <Container maxWidth="lg">
      <Grid container item>
        <Container maxWidth="lg">
          <header className={styles.grow}>
            <AppBar position="static" color="transparent">
              <Toolbar>
                <div className={styles.grow}>{Logo}</div>
                {ToolbarMenu}
              </Toolbar>
            </AppBar>
            {DrawerMenu}
            {WalletMenu}
          </header>
          <main className={styles.main}>{children}</main>
          
        </Container>
      </Grid>
    </Container>
    <Footer />
    </>
  );
};

export const MobileLayoutNoHeader: FunctionComponent<MobileLayoutProps> = ({
  withBackground,
  children,
}) => {
  const styles = useMobileLayoutStyles();
  useBackgroundReplacer(Boolean(withBackground));

  return (
    <>
    <Container maxWidth="lg">
      <Grid container item>
        <Container maxWidth="lg">
          <main className={styles.main}>{children}</main>
        </Container>
      </Grid>
    </Container>
    <Footer />
    </>
  );
};
