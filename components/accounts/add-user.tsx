import {Button, Divider, Input, Modal, Text} from '@nextui-org/react';
import React from 'react';
import {Flex} from '../styles/flex';

export const AddUser = () => {
   const [visible, setVisible] = React.useState(false);
   const handler = () => setVisible(true);

   const closeHandler = () => {
      setVisible(false);
      console.log('closed');
   };

   return (
      <div>
         <Button auto onClick={handler}>
            Add User
         </Button>
         <Modal
            closeButton
            aria-labelledby="modal-title"
            width="600px"
            open={visible}
            onClose={closeHandler}
         >
            <Modal.Header css={{justifyContent: 'start'}}>
               <Text id="modal-title" h4>
                  Crear usuario
               </Text>
            </Modal.Header>
            <Divider css={{my: '$5'}} />
            <Modal.Body css={{py: '$10'}}>
               <Flex
                  direction={'column'}
                  css={{
                     'flexWrap': 'wrap',
                     'gap': '$8',
                     '@lg': {flexWrap: 'nowrap', gap: '$12'},
                  }}
               >
                  <Flex
                     css={{
                        'gap': '$10',
                        'flexWrap': 'wrap',
                        '@lg': {flexWrap: 'nowrap'},
                     }}
                  >
                     <Input
                        label="Primer nombre"
                        bordered
                        clearable
                        fullWidth
                        size="lg"
                        placeholder="Primer nombre"
                     />
                     <Input
                        label="Apellidos"
                        clearable
                        bordered
                        fullWidth
                        size="lg"
                        placeholder="Apelldios"
                     />
                  </Flex>

                  <Flex
                     css={{
                        'gap': '$10',
                        'flexWrap': 'wrap',
                        '@lg': {flexWrap: 'nowrap'},
                     }}
                  >
                     <Input
                        label="Email"
                        clearable
                        bordered
                        fullWidth
                        size="lg"
                        placeholder="Email"
                     />
                     <Input
                        label="Telefono"
                        clearable
                        bordered
                        fullWidth
                        size="lg"
                        placeholder="Telefono"
                     />
                  </Flex>
                  <Flex
                     css={{
                        'gap': '$10',
                        'flexWrap': 'wrap',
                        '@lg': {flexWrap: 'nowrap'},
                     }}
                  >
                     <Input
                        label="Departamento"
                        clearable
                        bordered
                        fullWidth
                        size="lg"
                        placeholder="Departamento"
                     />
                     <Input
                        label="Rol"
                        clearable
                        bordered
                        fullWidth
                        size="lg"
                        placeholder="Rol"
                     />
                  </Flex>
               </Flex>
            </Modal.Body>
            <Divider css={{my: '$5'}} />
            <Modal.Footer>
               <Button auto onClick={closeHandler}>
                  Add User
               </Button>
            </Modal.Footer>
         </Modal>
      </div>
   );
};
