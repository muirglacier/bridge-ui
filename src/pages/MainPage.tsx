import React, { FunctionComponent } from 'react'
import { useSelector } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Route } from 'react-router-dom'
import { BridgePaperWrapper, BridgePurePaper, } from '../components/layout/Paper'
import { storageKeys } from '../constants/constants'
import { MintFlow } from '../features/mint/MintFlow'
import { ReleaseFlow } from '../features/release/ReleaseFlow'
import { $ui } from '../features/ui/uiSlice'
import { PaperTitleProvider } from '../providers/TitleProviders'
import { ConnectedMainLayout } from './MainLayout'
import { paths } from './routes'

const MainPage: FunctionComponent<RouteComponentProps> = ({
  history,
  location,
}) => {
  if (!localStorage.getItem(storageKeys.TERMS_AGREED)) {
    history.replace(paths.WELCOME);
  }
  if (location.pathname === "/") {
    history.replace(paths.WELCOME);
  }
  //useExchangeRates();
  //useGasPrices(); TODODO
  const { paperShaking } = useSelector($ui);
  return (
    <>
      <ConnectedMainLayout>
        <PaperTitleProvider>
          <BridgePaperWrapper>
            <BridgePurePaper shaking={paperShaking}>
              <Route path={paths.MINT} component={MintFlow} />
              <Route path={paths.RELEASE} component={ReleaseFlow} />
            </BridgePurePaper>
          </BridgePaperWrapper>
        </PaperTitleProvider>
      </ConnectedMainLayout>
    </>
  );
};

export default MainPage;
