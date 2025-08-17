# Stepper Simulator

A simple website that allows you to simulate how different stepper motors perform with various gantry and drive settings.

## Contribute

1.  Fork the repository
2.  Clone the repository
3.  Install the dependencies

    pnpm install

4.  Run the development server

    pnpm dev

You can add more stepper motors by adding a new row to the `data/steppers.csv` file and then running `pnpm data:update-stepper-db`.

## Thanks to

-   [eddytheengineer](https://www.youtube.com/@eddietheengineer) for the [initial Excel sheet](https://github.com/eddietheengineer/documentation/blob/master/stepper_motor/data/motor_torque_sim_v9_database.xlsm)
-   [MattThePrintingNerd](https://www.youtube.com/@MattThePrintingNerd) for the [updated sheet](https://github.com/MSzturc/the100/blob/main/Docs/motor_torque_sim_v9_database_updated.xlsm)

## License

This project is licensed under the [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.
