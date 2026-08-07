const CLOUDINARY = 'https://res.cloudinary.com/du3ytr3rx/image/upload';

export const SEED_PASSWORD = '1q2w3e4r';

export const rooms = [
  { name: 'Орбіта', imageUrl: `${CLOUDINARY}/v1785354265/1_iyhiaq.avif`, capacity: 4, floor: 1 },
  { name: 'Комета', imageUrl: `${CLOUDINARY}/v1785354266/2_uejtj4.jpg`, capacity: 6, floor: 1 },
  { name: 'Титан', imageUrl: `${CLOUDINARY}/v1785354266/3_h8rkqs.jpg`, capacity: 8, floor: 2 },
  { name: 'Венера', imageUrl: `${CLOUDINARY}/v1785354266/4_ubm2j5.jpg`, capacity: 12, floor: 2 },
  { name: "Сузір'я", imageUrl: `${CLOUDINARY}/v1785354266/5_mp6rpn.jpg`, capacity: 10, floor: 3 },
];

export const users = [
  { email: 'ivan.petrenko@gmail.com', firstName: 'Іван', lastName: 'Петренко' },
  { email: 'olena.kovalchuk@gmail.com', firstName: 'Олена', lastName: 'Ковальчук' },
  { email: 'taras.shevchenko@gmail.com', firstName: 'Тарас', lastName: 'Шевченко' },
];

// dayOffset рахується від понеділка поточного тижня, щоб не залежно коли запускається в тому тижні броні
export const bookings = [
  { room: 'Орбіта', user: 0, title: 'Щотижневий синк', dayOffset: 0, from: '10:00', to: '11:00' },
  { room: 'Орбіта', user: 1, title: 'Співбесіда', dayOffset: 0, from: '11:00', to: '12:30' },
  { room: 'Комета', user: 2, title: 'Ретроспектива', dayOffset: 1, from: '14:00', to: '15:30' },
  { room: 'Титан', user: 0, title: 'Демо для клієнта', dayOffset: 2, from: '09:00', to: '10:00' },
  {
    room: 'Венера',
    user: 1,
    title: 'Планування спринту',
    dayOffset: 2,
    from: '13:00',
    to: '17:00',
  },
  { room: 'Комета', user: 0, title: 'Один на один', dayOffset: 3, from: '16:30', to: '17:00' },
  { room: "Сузір'я", user: 2, title: 'Технічна нарада', dayOffset: 4, from: '15:00', to: '16:00' },

  // минулий тиждень
  { room: 'Орбіта', user: 0, title: 'Розбір інциденту', dayOffset: -7, from: '10:00', to: '11:00' },
  { room: 'Комета', user: 0, title: 'Груміння беклогу', dayOffset: -6, from: '11:00', to: '12:00' },
  { room: 'Титан', user: 0, title: 'Онбординг', dayOffset: -5, from: '14:00', to: '16:00' },
  {
    room: 'Венера',
    user: 1,
    title: 'Квартальні підсумки',
    dayOffset: -4,
    from: '09:30',
    to: '11:30',
  },

  // скасоване для перевірки чи вільний слот
  {
    room: 'Венера',
    user: 2,
    title: 'Скасована зустріч',
    dayOffset: 1,
    from: '10:00',
    to: '11:00',
    canceled: true,
  },
];
