"use client";
import { useState, createContext } from "react";
import initialDashboardData from "../dashboardData.json";
import ChatIcon from "../components/ChatIcon";
import TabSlider from "../components/TabSlider";
import DebtCard from "../components/DebtCard";
import Header from "../components/Header";
import Summary from "../components/Summary";
import AddDebtModal from "@/components/AddDebtModal";
import DataContext from "@/context/DataContext";
import React from "react";

interface Debt {
  id: string;
  lenderName: string;
  type: string;
  originalDebt: number;
  remainingDebt: number;
  amountPaid: number;
  percentageCompleted: number;
  interestRate: number;
  minimumPayment: number;
  paymentHistory: Array<{
    date: string;
    amount: number;
  }>;
  loanTermMonths?: number;
  creditLimit?: number;
  debtBalanceHistory?: Array<{
    date: string;
    remainingDebt: number;
  }>;
}

interface UserProfile {
  monthlyIncome: number;
  allocatedIncomePercentage: number;
  allocatedIncomeAmount: number;
}

interface DashboardOverview {
  totalDebtLeft: number;
  totalDebtPaid: number;
  totalOriginalDebt: number;
  overallProgressPercentage: number;
  debtBalanceHistory: Array<{
    date: string;
    remainingDebt: number;
  }>;
}

interface DashboardData {
  userProfile: UserProfile;
  debts: Debt[];
  dashboardOverview: DashboardOverview;
}

const calculateDashboardOverview = (debts: Debt[], monthlyIncome: number, updatedDebtId?: string): DashboardOverview => {
  let totalDebtLeft = 0;
  let totalDebtPaid = 0;
  let totalOriginalDebt = 0;
  let debtBalanceHistory1 = initialDashboardData.dashboardOverview.debtBalanceHistory || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  

  debts.forEach(debt => {
    totalDebtLeft += debt.remainingDebt;
    totalDebtPaid += debt.amountPaid;
    totalOriginalDebt += debt.originalDebt;
  });

  if (updatedDebtId) {
  debts.forEach(debt => {
    if (debt.id === updatedDebtId) {
      let { date } = debt.paymentHistory[debt.paymentHistory.length - 1];
      debtBalanceHistory1.push({ date, remainingDebt: totalDebtLeft });
    }
  });
  debtBalanceHistory1 = debtBalanceHistory1.reduce((acc: { date: string; remainingDebt: number }[], curr) => {
    const idx = acc.findIndex(item => item.date === curr.date);
    if (idx === -1) {
      acc.push(curr);
    } else {
      acc[idx] = curr;
    }
    return acc;
  }, []);
}


  const overallProgressPercentage = totalOriginalDebt > 0
    ? (totalDebtPaid / totalOriginalDebt) * 100
    : 0;

  return {
    totalDebtLeft: parseFloat(totalDebtLeft.toFixed(2)),
    totalDebtPaid: parseFloat(totalDebtPaid.toFixed(2)),
    totalOriginalDebt: parseFloat(totalOriginalDebt.toFixed(2)),
    overallProgressPercentage: parseFloat(overallProgressPercentage.toFixed(2)),
    debtBalanceHistory: debtBalanceHistory1
  };
};

export default function Home() {
 
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState<boolean>(false);

  const [aiPlan, setAiPlan] = useState<any>(null);

  const monthlyIncome = dashboardData.userProfile.monthlyIncome.toFixed(2);
  const allocatedIncome = dashboardData.userProfile.allocatedIncomePercentage.toFixed(1);

  const handleSetMonthlyIncome = (newValue: string) => {
    const newMonthlyIncome = parseFloat(newValue);
    setDashboardData(prevData => {
      const updatedUserProfile = {
        ...prevData.userProfile,
        monthlyIncome: newMonthlyIncome,
        allocatedIncomeAmount: newMonthlyIncome * (prevData.userProfile.allocatedIncomePercentage / 100)
      };
      const newOverview = calculateDashboardOverview(prevData.debts, newMonthlyIncome);
      return {
        ...prevData,
        userProfile: updatedUserProfile,
        dashboardOverview: newOverview
      };
    });
  };

  const handleSetAllocatedIncome = (newValue: string) => {
    const newAllocatedPercentage = parseFloat(newValue);
    setDashboardData(prevData => {
      const updatedUserProfile = {
        ...prevData.userProfile,
        allocatedIncomePercentage: newAllocatedPercentage,
        allocatedIncomeAmount: prevData.userProfile.monthlyIncome * (newAllocatedPercentage / 100)
      };

      const newState ={
        ...prevData,
        userProfile: updatedUserProfile
      };

      return newState;
    });
  };

  const handleUpdateDebt = (updatedDebt: Debt) => {
    let updatedDebtId = updatedDebt.id;
    setDashboardData(prevData => {
      const updatedDebts = prevData.debts.map(debt =>
        debt.id === updatedDebt.id ? updatedDebt : debt
      );

      const newOverview = calculateDashboardOverview(updatedDebts, prevData.userProfile.monthlyIncome, updatedDebtId);

      const a = {
        ...prevData,
        debts: updatedDebts,
        dashboardOverview: newOverview
      }

      return {
        ...prevData,
        debts: updatedDebts,
        dashboardOverview: newOverview
      };
    });
  };

  const handleOpenAddDebtModal = () => {
      setIsAddDebtModalOpen(true);
  };

  const handleCloseAddDebtModal = () => {
      setIsAddDebtModalOpen(false);
  };

   const handleSaveNewDebt = (debtData: any) => {

   
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      lenderName: debtData.lenderName,
      type: debtData.type,
      originalDebt: parseFloat(debtData.originalDebt),
      remainingDebt: parseFloat(debtData.originalDebt),
      amountPaid: 0,
      percentageCompleted: 0,
      interestRate: parseFloat(debtData.interestRate),
      minimumPayment: parseFloat(debtData.minimumPayment),
      paymentHistory: [],
      ...(debtData.loanTermMonths && !isNaN(parseFloat(debtData.loanTermMonths))) && { loanTermMonths: parseInt(debtData.loanTermMonths) },
      ...(debtData.creditLimit && !isNaN(parseFloat(debtData.creditLimit))) && { creditLimit: parseFloat(debtData.creditLimit) }
    };

    setDashboardData(prevData => {
        const updatedDebts = [...prevData.debts, newDebt];
        const newOverview = calculateDashboardOverview(updatedDebts, prevData.userProfile.monthlyIncome);

        return {
            ...prevData,
            debts: updatedDebts,
            dashboardOverview: newOverview,
        };
    });
    handleCloseAddDebtModal();
  };

  const aiChatData = {
    monthlyIncome: dashboardData.userProfile.monthlyIncome,
    allocatedIncomePercentage: dashboardData.userProfile.allocatedIncomePercentage,
    totalDebtLeft: dashboardData.dashboardOverview.totalDebtLeft,
    totalOriginalDebt: dashboardData.dashboardOverview.totalOriginalDebt,
  }

  return (
    <>
      <DataContext.Provider value={{aiPlan, setAiPlan}}>
        <Header />
        <div className="main-container">
          
          <div id="parent">
            <div id="left-div">
              <Summary
                monthlyIncome={monthlyIncome}
                setMonthlyIncome={handleSetMonthlyIncome}
                allocatedIncome={allocatedIncome}
                setAllocatedIncome={handleSetAllocatedIncome}
                
                dashboardOverview={dashboardData.dashboardOverview}
              />
              <TabSlider 
                userProfile={dashboardData.userProfile}
                debts={dashboardData.debts}
                dashboardOverview={dashboardData.dashboardOverview}
              />
            </div>

            <div id="right-div">
              {/* <Achievements /> */}
              <div className="active-debts-header">
                <h2>Active Debts</h2>
                <button className="btn add-debt-btn" onClick={handleOpenAddDebtModal}>Add Debt</button>
              </div>
              {isAddDebtModalOpen && (
                  <AddDebtModal
                      onClose={handleCloseAddDebtModal}
                      onSave={handleSaveNewDebt}
                  />
              )}
              {/* Map over the debts array to render DebtCard for each one */}
              <div className="scrollable-debt-list">
                {dashboardData.debts.map((debtItem: Debt) => {
                  return (
                    <React.Fragment key={debtItem.id}>
                    <DebtCard
                      debt={debtItem}
                      onUpdateDebt={handleUpdateDebt}
                    />
                    {/* <hr /> */}
                  </React.Fragment>
                    
                  );
                })}
              </div>
              
            </div>
          </div>
        </div>
        <ChatIcon userData={aiChatData}/>
      </DataContext.Provider>
    </>
  );
}