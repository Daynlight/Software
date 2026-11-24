import { fireEvent, render, screen } from "@testing-library/react";
import GroupFilters, { GroupFilterValues } from "./GroupFilters";

const values: GroupFilterValues = {
  search: "",
  leader: "",
  hasFreeSlots: false,
  minFreeSlots: "",
  sort: "createdAt",
};

describe("GroupFilters", () => {
  it("updates every filter control", () => {
    const onChange = jest.fn();
    render(
      <GroupFilters
        values={values}
        onChange={onChange}
        onSubmit={jest.fn()}
        onReset={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Szukaj"), {
      target: { value: "alpha" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ ...values, search: "alpha" });

    fireEvent.change(screen.getByLabelText("Lider"), {
      target: { value: "Nowak" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ ...values, leader: "Nowak" });

    fireEvent.change(screen.getByLabelText("Minimum miejsc"), {
      target: { value: "2" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...values,
      minFreeSlots: "2",
    });

    fireEvent.change(screen.getByLabelText("Sortowanie"), {
      target: { value: "freeSlots" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...values,
      sort: "freeSlots",
    });

    fireEvent.click(screen.getByLabelText("Tylko z wolnymi miejscami"));
    expect(onChange).toHaveBeenLastCalledWith({
      ...values,
      hasFreeSlots: true,
    });
  });

  it("submits and resets the form", () => {
    const onSubmit = jest.fn();
    const onReset = jest.fn();
    render(
      <GroupFilters
        values={values}
        onChange={jest.fn()}
        onSubmit={onSubmit}
        onReset={onReset}
      />,
    );

    fireEvent.submit(screen.getByRole("form", { name: "Filtry grup" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Filtruj" }));
    expect(onSubmit).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Wyczyść" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
