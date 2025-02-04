import {Button} from 'antd';

import styled from 'styled-components';

import Colors from '@styles/Colors';

export const Container = styled.div`
  width: 100vw;
  height: calc(100vh - 47px);
  display: grid;
  grid-template-rows: 1.25rem 15rem calc(100vh - 47px - 16.25rem);
`;

export const InformationMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 16px;
  color: ${Colors.grey7};
  font-weight: 600;
`;

export const StartProjectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  alig-items: center;
  width: 100%;
  padding: 0 6rem;
`;

export const StartProjectItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 1.5rem;
  :first-child {
    margin: 0 1.5rem 0 0;
  }
  :last-child {
    margin: 0 0 0 1.5rem;
  }
`;

export const StartProjectItemLogo = styled.img`
  width: 10rem;
  height: 10rem;
`;

export const StartProjectItemTitle = styled.div`
  margin-top: 1.5rem;
  font-size: 20px;
  color: ${Colors.whitePure};
  font-weight: 600;
  text-align: center;
  width: 100%;
`;

export const StartProjectItemDescription = styled.div`
  margin-top: 1rem;
  font-size: 14px;
  color: ${Colors.whitePure};
  font-weight: 400;
  text-align: center;
  width: 100%;
`;

export const StartProjectItemButton = styled(Button)`
  background: ${Colors.blue7};
  color: ${Colors.whitePure};
  margin-top: 1.5rem;
  border: 1px solid ${Colors.blue6};
  font-weight: 400;
  box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.043);
  border-radius: 2px;

  :hover,
  :active,
  :focus {
    background: ${Colors.blue7}CC;
    color: ${Colors.whitePure};
  }
`;
