import {Text} from '@nextui-org/react';
import React from 'react';
import {AcmeIcon} from '../icons/acme-icon';
import {Box} from '../styles/box';
import {Flex} from '../styles/flex';

export const CompaniesDropdown = () => {
  const company = {
    name: 'ProfitUpManager',
    location: 'Atenas - Alajuela - Costa Rica',
    logo: <AcmeIcon />,
  };

  return (
    <Box>
      <Flex align={'center'} css={{gap: '$7'}}>
        {company.logo}
        <Box>
          <Text
            h3
            size={'$xl'}
            weight={'medium'}
            css={{
              m: 0,
              color: '$foreground',     
              lineHeight: '$lg',
              mb: '-$5',
            }}
          >
            {company.name}
          </Text>
          <Text
            span
            weight={'medium'}
            size={'$xs'}
            css={{color: '$accents7'}}  
          >
            {company.location}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};
