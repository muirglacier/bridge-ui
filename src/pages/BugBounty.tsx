import { Container, styled, Typography , Box, Table, TableCell, TableBody, TableContainer} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Alert from "@material-ui/lab/Alert";
import React, { FunctionComponent, useCallback, useEffect } from "react";
import { RouteComponentProps } from "react-router";
import { ActionButton } from "../components/buttons/Buttons";
import { IconWithLabel } from "../components/icons/IconHelpers";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
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
import { StylesContext } from "@material-ui/styles";
import { Autocomplete } from "@material-ui/lab";

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
    marginTop: 20,
    marginLeft: "auto",
    marginRight: "auto"
    
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
  gaptop: {
    marginTop: 25,
  },
}));


export const BugBounty: FunctionComponent<RouteComponentProps> = ({
  history,
}) => {
  usePageTitle("Bug Bounty");
  const { showNotification } = useNotifications();
  const styles = useStyles();
  const handleAgree = useCallback(() => {
    history.replace(paths.WELCOME);
  }, [history]);


  return (
    <MobileLayout withBackground>
      <Container maxWidth="sm">
        <Typography variant="h1" className={styles.heading}>
          Defichain-Bridge Bug Bounty Program
        </Typography>
        <Typography variant="body1" gutterBottom={true} className={styles.description}>
        You are invited to play around with our software (both frontend and backend) and try to break it. If you find a bug and provide steps to reproduce it, you are eligible to receive up to 1500 USD in DFI per bug.
        </Typography>
        <TableContainer component={Paper} className={styles.gaptop}>
     <Table aria-label="simple table" stickyHeader>
       <TableHead>
         <TableRow>
           <TableCell>Severity</TableCell>
           <TableCell align="right">Reward</TableCell>
         </TableRow>
       </TableHead>
       <TableBody>
           <TableRow>
             <TableCell component="th" scope="row">
               Stealing funds or double spend
             </TableCell>
             <TableCell align="right">1500 USD</TableCell>
           </TableRow>
           <TableRow>
             <TableCell component="th" scope="row">
               Crashing the system for all users
             </TableCell>
             <TableCell align="right">1000 USD</TableCell>
           </TableRow>
           <TableRow>
             <TableCell component="th" scope="row">
               Users funds are lost (no payout and not recoverable)
             </TableCell>
             <TableCell align="right">300 USD</TableCell>
           </TableRow>
       </TableBody>
     </Table>
   </TableContainer>
   <ActionButton  className={styles.button} onClick={handleAgree}>
            Back to Start
    </ActionButton>
      </Container>
    </MobileLayout>
  );
};
