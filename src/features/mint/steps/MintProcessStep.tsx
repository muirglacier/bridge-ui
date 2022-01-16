import { Divider, IconButton } from "@material-ui/core";
import {
  GatewaySession,
} from "@renproject/ren-tx";
import {getDeposits, DepositEntry} from "../../../services/bridge"
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RouteComponentProps, useHistory, useLocation } from "react-router-dom";
import { Actor } from "xstate";
import {
  ActionButton,
  ToggleIconButton,
} from "../../../components/buttons/Buttons";
import { BackArrowIcon } from "../../../components/icons/RenIcons";
import {
  CenteringSpacedBox,
  PaperSpacerWrapper,
} from "../../../components/layout/LayoutHelpers";
import {
  PaperActions,
  PaperContent,
  PaperHeader,
  PaperNav,
  PaperTitle,
} from "../../../components/layout/Paper";
import { Debug } from "../../../components/utils/Debug";
import { WalletConnectionProgress } from "../../../components/wallet/WalletHelpers";
import { paths } from "../../../pages/routes";
import { useNotifications } from "../../../providers/Notifications";
import { usePageTitle, usePaperTitle } from "../../../providers/TitleProviders";
import {
  getChainConfigByRentxName,
  getCurrencyConfigByRentxName,
} from "../../../utils/assetConfigs";
import { $renNetwork } from "../../network/networkSlice";
import {
  BrowserNotificationButton,
  BrowserNotificationsDrawer,
} from "../../notifications/components/NotificationsHelpers";
import {
  useBrowserNotifications,
  useBrowserNotificationsConfirmation,
} from "../../notifications/notificationsUtils";
import { TransactionFees } from "../../transactions/components/TransactionFees";
import {
  TransactionMenu,
  UpdateTxFn,
} from "../../transactions/components/TransactionMenu";
import {
  BookmarkPageWarning,
  ExpiredErrorDialog,
  ProgressStatus,
  WrongAddressWarningDialog,
} from "../../transactions/components/TransactionsHelpers";
import {
  useSetCurrentTxId,
  useTransactionDeletion,
} from "../../transactions/transactionsHooks";
import {
  createTxQueryString,
  getAddressExplorerLink,
  getTxPageTitle,
  isTxExpired,
  parseTxQueryString,
  TxConfigurationStep,
  TxType,
  useTxParam,
} from "../../transactions/transactionsUtils";
import {
  useAuthRequired,
  useSelectedChainWallet,
} from "../../wallet/walletHooks";
import {
  $chain,
  setChain,
  setWalletPickerOpened,
} from "../../wallet/walletSlice";
import {
  DepositWrapper,
  MultipleDepositsMessage,
} from "../components/MintHelpers";
import {
  DestinationPendingStatus,
  MintCompletedStatus,
  MintDepositAcceptedStatus,
  MintDepositConfirmationStatus,
  MintDepositToStatus,
} from "../components/MintStatuses";
import {
  DepositNextButton,
  DepositPrevButton,
} from "../components/MultipleDepositsHelpers";
import { useDepositPagination, useMintMachine } from "../mintHooks";
import { resetMint } from "../mintSlice";
import { getLockAndMintParams, getRemainingGatewayTime } from "../mintUtils";


export const MintProcessStep: FunctionComponent<RouteComponentProps> = ({
  history,
  location,
}) => {
  useAuthRequired(true);
  const dispatch = useDispatch();
  const chain = useSelector($chain);
  
  const { walletConnected } = useSelectedChainWallet();
  const { tx: parsedTx, txState } = useTxParam();
  const [depositHash, setDepositHash] = useState<string>(parsedTx?.depositHash !== undefined ? parsedTx.depositHash + ":" + parsedTx.depositN : "");
  const [reloading, setReloading] = useState(false);
  const [tx, setTx] = useState<GatewaySession>(parsedTx as GatewaySession);

  useSetCurrentTxId(tx.id);

  usePageTitle(getTxPageTitle(tx));
  const [paperTitle, setPaperTitle] = usePaperTitle();
  useEffect(() => {
    if (!walletConnected) {
      setPaperTitle("Resume Transaction");
    }
  }, [walletConnected, setPaperTitle]);

  const handlePreviousStepClick = useCallback(() => {
    history.goBack();
  }, [history]);

 
  const destChain = parsedTx?.destChain;
  useEffect(() => {
    if (destChain) {
      const bridgeChainConfig = getChainConfigByRentxName(destChain);
      dispatch(setChain(bridgeChainConfig.symbol));
    }
  }, [dispatch, destChain]);

  const handleWalletPickerOpen = useCallback(() => {
    dispatch(setWalletPickerOpened(true));
  }, [dispatch]);

  const onBookmarkWarningClosed = useCallback(() => {
    history.replace({ ...location, state: undefined });
  }, [history, location]);

  const showTransactionStatus = !!tx && walletConnected;
  const feeCurrency = getCurrencyConfigByRentxName(tx.sourceAsset).symbol;

  const [counter, changeCounter] = useState(0);

  const updateTx = () => {
    getDeposits(tx.userAddress, tx.destChain).then((jsonObj) => {
    let txChange: GatewaySession = JSON.parse(JSON.stringify(tx));
    if(jsonObj.status == 1) {
        let changes = false;
        if(jsonObj.result !== undefined && jsonObj.result.data !== undefined && jsonObj.result.data.length > 0) {
            for(let i = 0; i<jsonObj.result.data.length; ++i) {
              const key = jsonObj.result.data[i].vout?.txid + ":" + jsonObj.result.data[i].vout?.n as string
              const result = (key in txChange.transactions)
              if(!result){
                txChange.transactions[key] = jsonObj.result.data[i]
                changes = true;
              }
            }
            if(depositHash === "" && Object.keys(txChange.transactions).length > 0){
              setDepositHash(Object.keys(txChange.transactions)[0])
            }
            if(changes){
              setTx(txChange)
            }
        }
    }})
  }

  const updateHash = ((hash: string) => {
    setDepositHash(hash)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      updateTx()
    }, 3000);
    return () => clearInterval(interval);
  }, [depositHash]);



   return (
    <>
      <PaperHeader>
        <PaperNav>
            <IconButton onClick={handlePreviousStepClick}>
              <BackArrowIcon />
            </IconButton>
        </PaperNav>
        <PaperTitle>{paperTitle}</PaperTitle>
        <PaperActions>
          
        </PaperActions>
      </PaperHeader>
      <PaperContent bottomPadding>
        {showTransactionStatus && (
          <MintTransactionStatus
            tx={tx}
            depositHash={depositHash}
            updateHash={updateHash}
          />
        )}
        {!walletConnected && (
          <>
            <PaperSpacerWrapper>
              <CenteringSpacedBox>
                <WalletConnectionProgress />
              </CenteringSpacedBox>
            </PaperSpacerWrapper>
            <ActionButton onClick={handleWalletPickerOpen}>
              Connect Wallet
            </ActionButton>
          </>
        )}
      </PaperContent>
      {walletConnected && (
        <>
          <Divider />
          <PaperContent darker topPadding bottomPadding>
            <TransactionFees
              chain={chain}
              currency={feeCurrency}
              type={TxType.MINT}
              address={tx.userAddress}
            />
          </PaperContent>
        </>
      )}
      
  
      <Debug it={{ tx, txState: txState }} />
    </>
  );
};

type OnMachineSendReadyFn = (
  send: ReturnType<typeof useMintMachine>[1]
) => void;

type MintTransactionStatusProps = {
  tx: GatewaySession;
  depositHash?: string;
  updateHash: (arg0: string) => void
};

const MintTransactionStatus: FunctionComponent<MintTransactionStatusProps> = ({
  tx,
  depositHash = "",
  updateHash
}) => {
  const chain = useSelector($chain);
  const renNetwork = useSelector($renNetwork);
  const { account } = useSelectedChainWallet();
  const [state, setState] = useState("restoringDeposit" as string)
  const {
    currentIndex,
    currentHash,
    total,
    handlePrev,
    handleNext,
  } = useDepositPagination(tx, depositHash, updateHash);




  const { showNotification, closeNotification } = useNotifications();
  const [signatures, setSignatures] = useState({})

  useEffect(() => {
    // here we decide on the transaction status
    const dep: DepositEntry = tx.transactions[depositHash]
    if(dep){
      const confs = dep?.good || false
      if(!confs) 
        setState("srcSettling")
      else {
        if(1==1 || depositHash in signatures){
          setState("accepted")
        }else{
          setState("srcConfirmed")
          // dispatch signature request
        }
        
      }
    }
  },[tx, depositHash, signatures]);

  const submitToBridge = () => {
      console.log("Submitting via Wallet Provider")
  }

  useEffect(() => {
    let key = 0;
    if (total > 1) {
      key = showNotification(<MultipleDepositsMessage />, {
        variant: "warning",
        persist: true,
      }) as number;
    }
    return () => {
      if (key) {
        closeNotification(key);
      }
    };
  }, [showNotification, closeNotification, total]);

  const [wrongAddressDialogOpened, setWrongAddressDialogOpened] = useState(
    false
  );
  const handleCloseWrongAddressDialog = useCallback(() => {
    setWrongAddressDialogOpened(false);
  }, []);

  useEffect(() => {
    if (
      account &&
      tx.userAddress &&
      account.toLowerCase() !== tx.userAddress.toLowerCase()
    ) {
      setWrongAddressDialogOpened(true);
    } else {
      setWrongAddressDialogOpened(false);
    }
  }, [account, tx.userAddress, tx]);

  const activeDeposit = useMemo<
    DepositEntry
   | null>(() => {
    if (!tx.transactions || tx.transactions.length == 0) {
      return null;
    }
    const deposit = tx.transactions[currentHash || depositHash];
    if (!deposit){
      return null;
    }
    return deposit;
  }, [currentHash, tx, depositHash]);

  // In order to enable quick restoration, we need to persist the deposit transaction
  // We persist via querystring, so lets check if the transaction is present
  // and update otherwise
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (!location.search) return;
    const queryTx = parseTxQueryString(location.search);
    const deposit = (queryTx?.transactions || {})[currentHash];
    // If we have detected a deposit, but there is no deposit in the querystring
    // update the queryString to have the deposit
    // TODO: to enable quick resume, we may want to ask users to update their bookmarks
    if (activeDeposit && !deposit) {
      history.replace({
        pathname: paths.MINT_TRANSACTION,
        search: "?" + createTxQueryString(tx),
      });
    }
  }, [currentHash, depositHash, location, activeDeposit, tx, history]);

  const { mintCurrencyConfig } = getLockAndMintParams(
    tx,
    currentHash
  );
  const accountExplorerLink = getAddressExplorerLink(
    chain,
    renNetwork,
    account
  );

  return (
    <>
      {activeDeposit ? (
        <DepositWrapper>
          <MintTransactionDepositStatus
            tx={tx}
            deposit={activeDeposit}
            depositHash={depositHash}
            state={state}
            submitter={submitToBridge}
          />
          {total > 1 && (
            <>
              <DepositPrevButton
                onClick={handlePrev}
                disabled={currentIndex === 0}
              />
              <DepositNextButton
                onClick={handleNext}
                disabled={currentIndex === total - 1}
              />
            </>
          )}
        </DepositWrapper>
      ) : (
        <MintDepositToStatus tx={tx} />
      )}
    

      <WrongAddressWarningDialog
        open={wrongAddressDialogOpened}
        address={account}
        addressExplorerLink={accountExplorerLink}
        currency={mintCurrencyConfig.short}
        onAlternativeAction={handleCloseWrongAddressDialog}
      />
      <Debug
        it={{
          depositHash,
          pagination: { currentIndex, currentHash, total },
          activeDeposit,
          total,
          currentIndex,
          currentHash,
        }}
      />
    </>
  );
};

type MintTransactionDepositStatusProps = {
  tx: GatewaySession;
  deposit: DepositEntry;
  depositHash: string;
  state: string;
  submitter: ()=>void
};


export const MintTransactionDepositStatus: FunctionComponent<MintTransactionDepositStatusProps> = ({
  tx,
  deposit,
  depositHash,
  state,
  submitter,
}) => {
  const history = useHistory();
  const location = useLocation();
 

  console.debug(tx.id, depositHash, state);
  switch (state) {
    case "srcSettling":
      return (
        <MintDepositConfirmationStatus tx={tx} depositHash={depositHash} />
      );
    case "srcConfirmed": // source sourceChain confirmations ok, but renVM still doesn't accept it
      return <ProgressStatus reason="Generating Signatures" />;
    case "errorAccepting":
    case "errorSubmitting":
    case "claiming":
    case "accepted": // RenVM accepted it, it can be submitted to ethereum
      return (
        <MintDepositAcceptedStatus
          tx={tx}
          depositHash={depositHash}
          submitting={state === "claiming"}
          submittingError={
            state === "errorSubmitting" || state === "errorAccepting"
          }
          onSubmit={submitter}
        />
      );
    case "destInitiated": // final txHash means its done or check if wallet balances went up
      return (
        <DestinationPendingStatus
          tx={tx}
          depositHash={depositHash}
          submitting={true}
        />
      );
    case "completed":
      //if (deposit.destTxHash) {
      //  return <MintCompletedStatus tx={tx} depositHash={depositHash} />;
      //} else {
        // FIXME: actually an error case, this shouldn't happen in this state
        return (
          <DestinationPendingStatus
            tx={tx}
            depositHash={depositHash}
            submitting={true}
          />
        );
      //}
    case "restoringDeposit":
      return <ProgressStatus reason="Restoring deposit" />;
    default:
      return <ProgressStatus reason="This is just weird" />;
  }
};
