import { Divider, IconButton } from "@material-ui/core";
import {
  GatewaySession,
} from "@renproject/ren-tx";
import {getDeposits, DepositEntry, Signature, SignatureMessage, getKeySignatures} from "../../../services/bridge"
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from 'usehooks-ts'
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
  BridgeChainConfig,
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
  useRedeem
} from "../../wallet/walletHooks";
import {
  $chain,
  setChain,
  setWalletPickerOpened,
} from "../../wallet/walletSlice";
import {
  DepositWrapper,
  MultipleDepositsMessage,
  GenericMessage
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
import { clearTimeout } from "timers";


export const MintProcessStep: FunctionComponent<RouteComponentProps> = ({
  history,
  location,
}) => {
  useAuthRequired(true);
  const dispatch = useDispatch();
  const chain = useSelector($chain);
  var rdDict: { [id: string]: string; } = {
    "bcc207a0e3745b9b4394e0daa6c098edc4224cb28379505c70b8407d73738905:0": "skip"
  }

  const [rdtx, setRdtx] = useLocalStorage('rdDict', rdDict)

  
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
    if(!tx) return;
    getDeposits(tx.userAddress, tx.destChain).then((jsonObj) => {
    let txChange: GatewaySession = JSON.parse(JSON.stringify(tx));
    if(jsonObj.status == 1) {
        let changes = false;
        if(jsonObj.result !== undefined && jsonObj.result.data !== undefined && jsonObj.result.data.length > 0) {
            for(let i = 0; i<jsonObj.result.data.length; ++i) {
              const key = jsonObj.result.data[i].vout?.txid + ":" + jsonObj.result.data[i].vout?.n as string
              if(key in rdtx) continue
              const result = (key in txChange.transactions)
              if(!result || JSON.stringify(txChange.transactions[key])!=JSON.stringify(jsonObj.result.data[i])){
                (txChange as any).transactions[key] = jsonObj.result.data[i]
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
            rdtx={rdtx}
            setRdtx={setRdtx}
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
  rdtx: any
  setRdtx: any
};

const MintTransactionStatus: FunctionComponent<MintTransactionStatusProps> = ({
  tx,
  depositHash = "",
  updateHash,
  rdtx,
  setRdtx
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



  var SigDict: { [id: string]: SignatureMessage; } = {}

  const { showNotification, closeNotification } = useNotifications();
  const [signatures, setSignatures] = useState(SigDict)
  const [timeOut, setTimeOut] = useState(0)
  let timeoutTimer: any = undefined

  const timeoutFunc = () =>
  {
    setTimeOut(timeOut+1)
  }

  useEffect(() => {
    // here we decide on the transaction status
    const dep: DepositEntry = tx.transactions[depositHash]
    console.log(dep)
    if(timeoutTimer!==undefined){
      clearTimeout(timeoutTimer)
      timeoutTimer = undefined
    }

    if(dep){
      const confs = dep?.good || false
      if(!confs) 
        setState("srcSettling")
      else {
        if(depositHash in signatures){
          console.log(rdtx)
          console.log(depositHash)
          if(depositHash in rdtx){
            setState("completed")
          }else{
            setState("accepted")
          }
        }else{
            setState("srcConfirmed")
            submitSignRequest()
            timeoutTimer = setTimeout(timeoutFunc, 12000)
        }
        
      }
    }
  },[tx, depositHash, signatures, rdtx, timeOut]);
  


  const submitToBridge = async() => {
      console.log("Submitting via Wallet Provider")
      const siggy = signatures[depositHash]
      if(siggy['signatures'] == undefined) return
      const r = '0x' + siggy['signatures'][0]['r'] || ''
      const s = '0x' + siggy['signatures'][0]['s'] || ''
      const v = siggy['signatures'][0]['recovery_id']=="00" ? 0 : 1
      console.log(tx.destAddress, depositHash.split(":")[0], parseInt(depositHash.split(":")[1]), activeDeposit?.vout?.value_satoshi || 0, tx.sourceAsset, r, s, v + 27)
      let res: any = await getSignatures(tx.destAddress, depositHash.split(":")[0], parseInt(depositHash.split(":")[1]), activeDeposit?.vout?.value_satoshi || 0, tx.sourceAsset, r, s, v + 27)
      if(res.err!==null && res.err?.code != 0) {
        console.log(res.err?.message)
        showNotification(res.err?.message as string || "", {
          variant: "error",
          persist: false,
        });
      }else{
        console.log(res);
        let rdCopy = JSON.parse(JSON.stringify(rdtx))
        rdCopy[depositHash] = res.result
        setRdtx(rdCopy)
      }
  }

  const submitSignRequest = async() => {
    console.log("Submitting Signing Request")
    getKeySignatures(tx.destAddress, (activeDeposit?.vout?.txid || "").replace("0x",""), activeDeposit?.vout?.n || 0, tx.destChain).then((sigs) => {
      if(sigs && sigs?.status == 1){
        let sigCopy = JSON.parse(JSON.stringify(signatures))
        sigCopy[depositHash] = sigs
        setSignatures(sigCopy)
      }
    }).catch((err) => {})
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
    if ((tx?.transactions === undefined)) {
      return null;
    }
    const deposit = tx.transactions[currentHash || depositHash];
    if (!deposit){
      return null;
    }
    return deposit;
  }, [currentHash, tx, depositHash]);

  const {getSignatures} = useRedeem()


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
            mintHash={rdtx[depositHash]}
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
  mintHash: string;
};


export const MintTransactionDepositStatus: FunctionComponent<MintTransactionDepositStatusProps> = ({
  tx,
  deposit,
  depositHash,
  state,
  submitter,
  mintHash,
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
      return <MintCompletedStatus tx={tx} depositHash={depositHash} mintHash={mintHash} chain={tx.destChain}/>;
    case "restoringDeposit":
      return <ProgressStatus reason="Restoring deposit" />;
    default:
      return <ProgressStatus reason="This is just weird" />;
  }
};
