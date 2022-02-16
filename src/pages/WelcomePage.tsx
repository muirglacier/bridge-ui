import { Container, styled, Typography , Box} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { FunctionComponent, useCallback, useEffect } from "react";
import { RouteComponentProps } from "react-router";
import { ActionButton } from "../components/buttons/Buttons";
import { IconWithLabel } from "../components/icons/IconHelpers";
import {
  BchFullIcon,
  BinanceChainFullIcon,
  BtcFullIcon,
  DefiIcon,
  DogeFullIcon,
  EmptyCircleIcon,
  EthereumChainFullIcon,
  WarningIcon,
  ZecFullIcon,
} from "../components/icons/RenIcons";
import { BridgeLogoIcon } from "../components/icons/RenIcons";
import { NarrowCenteredWrapper } from "../components/layout/LayoutHelpers";
import { MobileLayout } from "../components/layout/MobileLayout";
import { Link } from "../components/links/Links";
import { UnstyledList } from "../components/typography/TypographyHelpers";
import { links, storageKeys } from "../constants/constants";
import { useNotifications } from "../providers/Notifications";
import { usePageTitle } from "../providers/TitleProviders";
import { paths } from "./routes";

const useStyles = makeStyles((theme) => ({
  root: {},
  heading: {
    marginTop: 112,
    textAlign: "center",
    color: theme.palette.text.primary,
  },
  description: {
    marginTop: 24,
    textAlign: "center",
    color: theme.customColors.textLight,
  },
  continuation: {
    marginTop: 48,
    textAlign: "center",
  },
  button: {
    maxWidth: 400,
    marginTop: 20,
  },
  supported: {
    marginTop: 82,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
      justifyContent: "stretch",
    },
  },
  assets: {
    [theme.breakpoints.up("md")]: {
      paddingRight: 42,
      flexGrow: 5,
      borderRight: `2px solid ${theme.customColors.grayDisabled}`,
    },
  },
  chains: {
    // width: "20%",
    [theme.breakpoints.up("md")]: {
      paddingLeft: 40,
      flexGrow: 1,
    },
  },
  label: {
    color: theme.customColors.textLight,
    fontWeight: "bold",
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      textAlign: "left",
    },
  },
  assetsList: {
    margin: "12px auto",
    display: "flex",
    justifyContent: "center",
    [theme.breakpoints.up("md")]: {
      justifyContent: "space-between",
    },
  },
  assetListItem: {
    padding: `0px 4px 0px 4px`,
    [theme.breakpoints.up("sm")]: {
      padding: `0px 12px 0px 12px`,
    },
    [theme.breakpoints.up("md")]: {
      padding: 0,
    },
  },
  legacy: {
    marginTop: 70,
    textAlign: "center",
  },
}));

const AdjustedWarningIcon = styled(WarningIcon)({
  marginBottom: -5,
});

export const WelcomePage: FunctionComponent<RouteComponentProps> = ({
  history,
}) => {
  usePageTitle("Welcome");
  const { showNotification } = useNotifications();
  const styles = useStyles();
  const handleAgree = useCallback(() => {
    localStorage.setItem(storageKeys.TERMS_AGREED, "1");
    history.replace(paths.MINT);
  }, [history]);

  return (
    <MobileLayout withBackground>
      <Container maxWidth="sm">
        <Typography variant="h1" className={styles.heading}>
          Easily Move Token Between Defichain and X
        </Typography>
        <Typography variant="body1" className={styles.description}>
          Defichain-Bridge is an easy and non-custodial peer-to-peer system that allows for using native Defichain Assets on other blockchains.
        </Typography>
        <Typography variant="body1" className={styles.description}>
        <b>Warning: Defichain-Bridge is still in Alpha stage and therefore experimental software. Before conducting more code reviews, it cannot be guaranteed that the code is bug-free. Please only test with small amounts that you can afford to lose.</b>
        </Typography>

        <Typography variant="body1" className={styles.continuation}>
          To continue, read and agree to the{" "}
          <Link
            color="primary"
            underline="hover"
            target="_blank"
            href={links.TERMS_OF_SERVICE}
          >
            Terms of Service
          </Link>
        </Typography>
        <NarrowCenteredWrapper>
          <ActionButton className={styles.button} onClick={handleAgree}>
            Agree & Continue
          </ActionButton>
        </NarrowCenteredWrapper>
      </Container>
      <Container maxWidth="xs">
        <div className={styles.supported}>
          <div className={styles.assets}>
            <Typography
              variant="overline"
              component="h2"
              className={styles.label}
            >
              Assets
            </Typography>
            <UnstyledList className={styles.assetsList}>
              <li className={styles.assetListItem}>
                <IconWithLabel label="DefiChain DFI" Icon={DefiIcon} />
              </li>
              
              <li className={styles.assetListItem}>
                <IconWithLabel label="+ more soon" Icon={EmptyCircleIcon} />
              </li>
            </UnstyledList>
          </div>
          <div className={styles.chains}>
            <Typography
              variant="overline"
              component="h2"
              className={styles.label}
            >
              Destination
            </Typography>
            <UnstyledList className={styles.assetsList}>
              <li className={styles.assetListItem}>
                <IconWithLabel label="Ethereum" Icon={EthereumChainFullIcon} />
              </li>
              <li className={styles.assetListItem}>
                <IconWithLabel label="Binance Smart Chain" Icon={BinanceChainFullIcon} />
              </li>
            </UnstyledList>
          </div>
        </div>
       
      </Container>
    </MobileLayout>
  );
};
