Function SingleCoilTorque(StepAngle As Double, RatedCurrent As Double, Torque As Double, Inductance As Double, Resistance As Double, RotorInertia As Double, InputVoltage As Double, DriveCurrent As Double, RPS As Double) As Double
    F_Coil = RPS * (360 / StepAngle) / 4
    X_Coil = 2 * 3.1415 * F_Coil * Inductance / 1000
    Z_Coil = X_Coil + Resistance
    V_Gen = 2 * 3.1415 * RPS * (Torque / (100 * 1.414) / RatedCurrent)
    If InputVoltage > V_Gen Then V_Avail = InputVoltage - V_Gen Else V_Avail = 0
    I_Avail = V_Avail / Z_Coil
    If I_Avail > DriveCurrent Then I_Actual = DriveCurrent Else I_Actual = I_Avail
    Torque_Percent = I_Actual / RatedCurrent
    T_1Coil = Torque_Percent * Torque / (100 * 1.414)
    T_2Coil = T_1Coil * 1.414
    V_Coil = I_Actual * Resistance
    Power = (V_Coil + V_Gen) * I_Actual
    
    SingleCoilTorque = T_1Coil * 100
    
End Function

Function StepperPower(StepAngle As Double, RatedCurrent As Double, Torque As Double, Inductance As Double, Resistance As Double, RotorInertia As Double, InputVoltage As Double, DriveCurrent As Double, RPS As Double) As Double
    F_Coil = RPS * (360 / StepAngle) / 4
    X_Coil = 2 * 3.1415 * F_Coil * Inductance / 1000
    Z_Coil = X_Coil + Resistance
    V_Gen = 2 * 3.1415 * RPS * (Torque / (100 * 1.414) / RatedCurrent)
    If InputVoltage > V_Gen Then V_Avail = InputVoltage - V_Gen Else V_Avail = 0
    I_Avail = V_Avail / Z_Coil
    If I_Avail > DriveCurrent Then I_Actual = DriveCurrent Else I_Actual = I_Avail
    Torque_Percent = I_Actual / RatedCurrent
    T_1Coil = Torque_Percent * Torque / (100 * 1.414)
    T_2Coil = T_1Coil * 1.414
    V_Coil = I_Actual * Resistance
    Power = (V_Coil + V_Gen) * I_Actual
    
    StepperPower = Power
End Function
