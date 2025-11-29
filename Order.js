import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { User } from './User.js';

export const Order = sequelize.define('Order', {
  total: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' }
});

Order.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });