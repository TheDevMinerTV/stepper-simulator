# Stepper Simulator

A simple website that allows you to simulate how different stepper motors perform with various gantry and drive settings.

## Contribute

0. Install Node.js v24, install corepack (`npm i -g corepack@latest`, `corepack enable`)
1. Fork the repository
2. Clone the repository
3. Install the dependencies

    ```sh
    pnpm install
    ```

4. Run the development server

    ```sh
    pnpm dev
    ```

`pnpm dev` serves the app and the OpenGraph endpoints together, so `/og.png?config=…` and the per-link `<head>` tags work the same as in production.

`pnpm build` produces the SPA in `dist/public`, its shell in `dist/template` and a Nitro server in `.output`; `pnpm preview` runs the built server. The server only exists to give crawlers per-link OpenGraph tags and a rendered torque graph, see [ADR-0003](./docs/adr/0003-request-time-opengraph-server.md).

You can add more stepper motors by adding a new row to the `data/steppers.tsv` file and then running `pnpm data:update-stepper-db`.

Removing a row is fine too: share links reference steppers by `brand|model`, so `pnpm data:update-stepper-db` moves anything that left the source files into `data/archived-steppers.json` and into `ARCHIVED_STEPPER_DB` in the generated `src/lib/stepper-db.ts`. Archived motors are hidden from the picker but old links still resolve them, so commit both files together. If a motor was renamed rather than removed, map its old id to the new one in `data/stepper-aliases.json`.

## Thanks to

- [eddytheengineer](https://www.youtube.com/@eddietheengineer) for the [initial Excel sheet](https://github.com/eddietheengineer/documentation/blob/master/stepper_motor/data/motor_torque_sim_v9_database.xlsm)
- [MattThePrintingNerd](https://www.youtube.com/@MattThePrintingNerd) for the [updated sheet](https://github.com/MSzturc/the100/blob/main/Docs/motor_torque_sim_v9_database_updated.xlsm)
- [ijo Pewa](https://bsky.app/profile/peraf191.bsky.social) for the [another stepper DB](https://docs.google.com/spreadsheets/d/1k9t3DWM2Y4Woi8LwcusVYmXaR-xXhaoPenG4Cc03Q_Q/edit?gid=2072803242#gid=2072803242) annd [a list of steppers in common VORON kits](https://docs.google.com/spreadsheets/d/1yR01doP-VDGOTzo3UFn6p9B9MzXFYckLLVf_dpL7SM8/edit?gid=1112171596#gid=1112171596)
- [Voron3D Wiki](https://voron3d.wiki) for [another stepper DB](https://voron3d.wiki/electronics/stepper-motor/stepper-motor/#stepper-motor-database)

## License

This project is licensed under the [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.
