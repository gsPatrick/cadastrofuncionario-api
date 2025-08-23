module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define('Settings', {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSONB, // Usar JSONB para armazenar valores complexos como arrays
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    tableName: 'settings',
    timestamps: true,
  });
  return Settings;
};