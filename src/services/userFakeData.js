// mockData.js
export const initialUserData = {
  account: 'Tony',
  username: '菜tony',
  password: 'Ss39268989',
  email: 'Tony@example.com',
  phone: '0928690668',
}

export const initialProfileData = {
  fullname: '王陽明',
  gender: '男',
  birthday: '1990-01-01',
  address: '台南市安南區',
  avatar:
    'https://images.unsplash.com/photo-1600081522768-cb2e80ed4491?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
}

export const initialAddressData = [
  {
    address_id: 1,
    recipient_name: '蔡阿嘎',
    recipient_phone: '0912-888-999',
    postal_code: '700',
    address_detail: '台南市安南區海佃路一段100號',
    is_default: true,
  },
  {
    address_id: 2,
    recipient_name: '許光漢',
    recipient_phone: '0922-111-222',
    postal_code: '701',
    address_detail: '台南市中西區民族路200號',
    is_default: false,
  },
]
